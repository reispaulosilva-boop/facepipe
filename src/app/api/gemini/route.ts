import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// O SDK v2 usa a variável de ambiente GEMINI_API_KEY automaticamente se não for passada
const client = new GoogleGenAI();

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { prompt, imageParts, model = "gemini-2.0-flash" } = body;

  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  try {
    // Adaptando para a estrutura do novo SDK (@google/genai)
    const contents = [
      {
        parts: [
          { text: prompt },
          ...(imageParts || []).map((part: any) => ({
            inline_data: {
              mime_type: part.inlineData.mimeType,
              data: part.inlineData.data
            }
          }))
        ]
      }
    ];

    const response = await client.models.generateContent({
      model,
      contents
    });

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini SDK v2 Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate content" },
      { status: 500 }
    );
  }
}
