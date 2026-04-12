import { GoogleGenAI, type Part } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Limite de execução declarado para a plataforma (Vercel respeita este valor).
// Gemini 2.5 Flash pode levar até ~20s em imagens grandes; 60s dá margem para caching.
export const maxDuration = 60;

// 4 MB — limite serverless da Vercel é 4.5 MB; 500 KB de margem para headers/overhead
const MAX_BODY_BYTES = 4 * 1024 * 1024;

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── In-memory context cache registry ─────────────────────────────────────────
// Maps imageHash → { cacheName (Gemini resource name), expiresAt (ms) }
// Reset on cold starts — acceptable since cache is a perf optimization only.
const imageCache = new Map<string, { cacheName: string; expiresAt: number }>();

// Formato de entrada dos imageParts vindos do cliente
interface ImagePartInput {
  inlineData: { mimeType: string; data: string };
}

interface GeminiRequestBody {
  prompt: string;
  imageParts?: ImagePartInput[];
  model?: string;
  responseFormat?: string;
  /** SHA-256 hex digest of the base64 image data — used as context cache key */
  imageHash?: string;
}

// ── Logging estruturado ───────────────────────────────────────────────────────

type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, event: string, fields: Record<string, unknown>) {
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    service: "gemini-route",
    event,
    ...fields,
  });
  if (level === "error") {
    console.error(entry);
  } else if (level === "warn") {
    console.warn(entry);
  } else {
    console.log(entry);
  }
}

// Classifica erros da API Gemini em categorias operacionais
function classifyGeminiError(error: unknown): string {
  if (!(error instanceof Error)) return "unknown";
  const msg = error.message.toLowerCase();
  if (msg.includes("quota") || msg.includes("resource_exhausted")) return "quota_exceeded";
  if (msg.includes("api_key") || msg.includes("invalid_argument") && msg.includes("key")) return "auth_error";
  if (msg.includes("safety") || msg.includes("blocked")) return "safety_block";
  if (msg.includes("timeout") || msg.includes("deadline")) return "timeout";
  if (msg.includes("recitation")) return "recitation_block";
  if (msg.includes("503") || msg.includes("overloaded") || msg.includes("unavailable")) return "service_unavailable";
  return "api_error";
}

// ── Auth ──────────────────────────────────────────────────────────────────────

// Valida o token Bearer contra API_SECRET.
// Se API_SECRET não estiver configurado, permite todas as requisições (modo dev).
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.API_SECRET;
  if (!secret) return true;

  const auth = request.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return false;
  return auth.slice(7) === secret;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const requestStart = Date.now();

  // 1. Autenticação
  if (!isAuthorized(request)) {
    log("warn", "request_unauthorized", { ip: request.headers.get("x-forwarded-for") ?? "unknown" });
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // 2. Validação de tamanho via Content-Length (verificação rápida antes de ler o body)
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    log("warn", "payload_too_large", { contentLength, limitBytes: MAX_BODY_BYTES });
    return NextResponse.json(
      { error: "Payload muito grande. Máximo permitido: 4 MB." },
      { status: 413 }
    );
  }

  // 3. Verificação da API key
  if (!process.env.GEMINI_API_KEY) {
    log("error", "missing_api_key", {});
    return NextResponse.json(
      { error: "GEMINI_API_KEY não configurada." },
      { status: 500 }
    );
  }

  // 4. Parse do body
  let body: GeminiRequestBody;
  try {
    body = await request.json();
  } catch {
    log("warn", "invalid_json_body", {});
    return NextResponse.json({ error: "JSON inválido no body." }, { status: 400 });
  }

  // 5. Validação do tamanho real após parse (Content-Length pode estar ausente ou incorreto)
  const actualSize = new TextEncoder().encode(JSON.stringify(body)).length;
  if (actualSize > MAX_BODY_BYTES) {
    log("warn", "payload_too_large", { actualSize, limitBytes: MAX_BODY_BYTES });
    return NextResponse.json(
      { error: "Payload muito grande. Máximo permitido: 4 MB." },
      { status: 413 }
    );
  }

  const { prompt, imageParts, model = "gemini-2.5-flash", responseFormat, imageHash } = body;

  if (!prompt || typeof prompt !== "string") {
    log("warn", "missing_prompt", {});
    return NextResponse.json({ error: "O campo prompt é obrigatório." }, { status: 400 });
  }

  const imageCount = Array.isArray(imageParts) ? imageParts.length : 0;

  log("info", "request_received", {
    model,
    promptChars: prompt.length,
    imageCount,
    payloadBytes: actualSize,
    hasImageHash: !!imageHash,
  });

  try {
    // ── Context Caching ───────────────────────────────────────────────────────
    // Try to cache the image so repeated analyses of the same photo skip re-upload.
    let cachedContentName: string | undefined;

    if (imageHash && Array.isArray(imageParts) && imageParts.length > 0) {
      const existing = imageCache.get(imageHash);
      if (existing && existing.expiresAt > Date.now()) {
        cachedContentName = existing.cacheName;
        log("info", "cache_hit", { imageHash: imageHash.slice(0, 8) });
      } else {
        try {
          const cacheContents = imageParts
            .filter(p => typeof p?.inlineData?.mimeType === "string" && typeof p?.inlineData?.data === "string")
            .map(p => ({ inlineData: { mimeType: p.inlineData.mimeType, data: p.inlineData.data } } as Part));

          const cache = await client.caches.create({
            model,
            config: {
              contents: [{ role: "user", parts: cacheContents }],
              displayName: `facepipe-${imageHash.slice(0, 16)}`,
              ttl: "3600s",
            },
          });

          if (cache.name) {
            cachedContentName = cache.name;
            imageCache.set(imageHash, {
              cacheName: cache.name,
              expiresAt: Date.now() + 55 * 60 * 1000, // 55 min (5 min before Gemini expiry)
            });
            log("info", "cache_created", { imageHash: imageHash.slice(0, 8), cacheName: cache.name });
          }
        } catch (cacheErr) {
          // Cache creation can fail when the image has < 32 768 tokens (minimum).
          // Fall through gracefully — the image will be sent inline.
          log("warn", "cache_creation_failed", { imageHash: imageHash.slice(0, 8), error: String(cacheErr) });
        }
      }
    }

    // ── Build request parts ───────────────────────────────────────────────────
    // When using cached content the image is already on Gemini's side — only
    // send the text prompt in the request contents.
    const parts: Part[] = [{ text: prompt }];

    if (!cachedContentName && Array.isArray(imageParts)) {
      for (const p of imageParts) {
        if (
          typeof p?.inlineData?.mimeType === "string" &&
          typeof p?.inlineData?.data === "string"
        ) {
          parts.push({
            inlineData: {
              mimeType: p.inlineData.mimeType,
              data: p.inlineData.data,
            },
          });
        }
      }
    }

    const contents = [{ role: "user" as const, parts }];

    const config = {
      ...(cachedContentName && { cachedContent: cachedContentName }),
      ...(responseFormat === "json" && { responseMimeType: "application/json" as const }),
      ...(responseFormat === "json" && { temperature: 0.2 }),
    };

    const apiStart = Date.now();

    const response = await client.models.generateContent({
      model,
      contents,
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    const apiLatencyMs = Date.now() - apiStart;
    const totalLatencyMs = Date.now() - requestStart;

    const usage = response.usageMetadata;
    const finishReason = response.candidates?.[0]?.finishReason ?? "UNKNOWN";

    log("info", "request_success", {
      model,
      finishReason,
      apiLatencyMs,
      totalLatencyMs,
      promptTokens: usage?.promptTokenCount ?? null,
      outputTokens: usage?.candidatesTokenCount ?? null,
      totalTokens: usage?.totalTokenCount ?? null,
      outputChars: response.text?.length ?? 0,
    });

    return NextResponse.json({ text: response.text });
  } catch (error: unknown) {
    const totalLatencyMs = Date.now() - requestStart;
    const errorType = classifyGeminiError(error);
    const message = error instanceof Error ? error.message : "Falha ao gerar conteúdo.";

    log("error", "request_failed", {
      model,
      errorType,
      errorMessage: message,
      totalLatencyMs,
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
