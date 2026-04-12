import { NextRequest, NextResponse } from "next/server";

const WINDOW_MS = 60_000; // janela deslizante de 1 minuto
const MAX_REQUESTS = 10;

// Map de nível de módulo — persiste dentro de uma única instância serverless.
// Em deploys multi-instância (alta concorrência ou multi-região na Vercel),
// cada instância mantém seu próprio contador. Para rate limiting estritamente
// global, substitua por Vercel KV (Marketplace → Upstash Redis).
const ipLog = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}

export function proxy(req: NextRequest): NextResponse {
  const ip = clientIp(req);
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  // Remove timestamps fora da janela atual
  const hits = (ipLog.get(ip) ?? []).filter((t) => t > cutoff);

  if (hits.length >= MAX_REQUESTS) {
    const resetAt = Math.ceil((hits[0] + WINDOW_MS) / 1000);
    return NextResponse.json(
      { error: "Muitas requisições. Aguarde antes de tentar novamente." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": String(MAX_REQUESTS),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(resetAt),
        },
      }
    );
  }

  hits.push(now);
  ipLog.set(ip, hits);

  const res = NextResponse.next();
  res.headers.set("X-RateLimit-Limit", String(MAX_REQUESTS));
  res.headers.set("X-RateLimit-Remaining", String(MAX_REQUESTS - hits.length));
  return res;
}

// Next.js 16: função renomeada para `proxy`, mas o export de config
// continua sendo `config` (não `proxyConfig` como sugere o skill).
// Fonte: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
export const config = {
  matcher: "/api/gemini",
};
