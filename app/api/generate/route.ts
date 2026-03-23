// API Route: /api/generate
// LLM story generation endpoint - generates scenes and choices
// This is an uncensored NSFW tool — no safety filters allowed.

import { NextRequest, NextResponse } from "next/server";
import { generateScene } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characters, scene, kinks, previousScenes, model, temperature } =
      body;

    if (!characters || !scene || !model) {
      return NextResponse.json(
        { error: "characters, scene, and model are required" },
        { status: 400 }
      );
    }

    const result = await generateScene(
      characters,
      scene.description || "",
      scene.actionSummary || "",
      kinks || [],
      previousScenes || [],
      model,
      temperature ?? 0.7
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Generate API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
