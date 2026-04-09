import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { prompt, imageParts, model = "gemini-2.5-flash", responseFormat } = body;

  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  try {
    const contents = [
      {
        role: "user",
        parts: [
          { text: prompt },
          ...(imageParts || []).map((part: any) => ({
            inlineData: {
              mimeType: part.inlineData.mimeType,
              data: part.inlineData.data
            }
          }))
        ]
      }
    ];

    const config = responseFormat === "json"
      ? { responseMimeType: "application/json", temperature: 0.2 }
      : undefined;

    const response = await client.models.generateContent({
      model,
      contents,
      ...(config && { config })
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
