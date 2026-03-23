// API Route: /api/extract
// VLM extraction endpoint - extracts characters, scene, kinks from image
// This is an uncensored NSFW tool — no safety filters allowed.

import { NextRequest, NextResponse } from "next/server";
import { extractFromImage, extractFromImageTwoPass } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageDataUrl, model, customPrompt } = body;

    if (!imageDataUrl) {
      return NextResponse.json(
        { error: "imageDataUrl is required" },
        { status: 400 }
      );
    }

    if (!model) {
      return NextResponse.json(
        { error: "model is required" },
        { status: 400 }
      );
    }

    // If custom prompt is provided, use two-pass extraction
    let result;
    if (customPrompt && customPrompt.trim()) {
      result = await extractFromImageTwoPass(imageDataUrl, model, customPrompt);
    } else {
      result = await extractFromImage(imageDataUrl, model);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Extract API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
