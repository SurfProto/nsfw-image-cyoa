// LangGraph Node: VLM Image Extraction
// Extracts characters, scene, kinks from image(s)

import type { StoryState } from "../state";
import { generateId } from "@/lib/utils";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

async function callOpenRouter(
  model: string,
  messages: OpenRouterMessage[],
  temperature: number = 0.7
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "NSFW Image-to-CYOA",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function parseJsonResponse(rawResponse: string): Record<string, unknown> {
  let cleaned = rawResponse
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("VLM raw response:", rawResponse);
    throw new Error("Failed to parse JSON from VLM response");
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("VLM raw response:", rawResponse);
    console.error("Extracted JSON string:", jsonMatch[0]);
    throw new Error(`Failed to parse JSON from VLM response: ${e instanceof Error ? e.message : e}`);
  }
}

async function extractSingleImage(
  imageDataUrl: string,
  model: string
): Promise<{
  characters: Array<{ name: string; appearance: string; personality: string; relationships: string }>;
  scene_description: string;
  action_summary: string;
  kinks: string[];
}> {
  const systemPrompt = `You are an image analysis assistant. Your task is to accurately describe what is VISIBLY present in the image. Be factual and descriptive. Only describe what you can actually see - do not add, invent, or hallucinate details that are not clearly visible in the image.`;

  const userPrompt = `Analyze this image and extract ONLY what is visibly present. Return ONLY valid JSON with this exact structure:
{
  "characters": [{ "name": "", "appearance": "", "personality": "", "relationships": "" }],
  "scene_description": "",
  "action_summary": "",
  "kinks": ["kink1", "kink2"]
}

IMPORTANT: Only describe what is ACTUALLY VISIBLE in the image. Do not add details that are not present. Be accurate and factual. If something is not clearly visible, do not describe it.`;

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        { type: "image_url", image_url: { url: imageDataUrl } },
        { type: "text", text: userPrompt },
      ],
    },
  ];

  const rawResponse = await callOpenRouter(model, messages, 0.3);
  return parseJsonResponse(rawResponse) as {
    characters: Array<{ name: string; appearance: string; personality: string; relationships: string }>;
    scene_description: string;
    action_summary: string;
    kinks: string[];
  };
}

export async function extractNode(state: StoryState): Promise<Partial<StoryState>> {
  const { imageDataUrls, modelConfig } = state;

  if (!imageDataUrls || imageDataUrls.length === 0) {
    throw new Error("No images provided for extraction");
  }

  // For now, handle single image extraction
  // Multi-image fusion will be added in Phase 4
  const result = await extractSingleImage(imageDataUrls[0], modelConfig.vlmModel);

  const characters = (result.characters || []).map((c) => ({
    ...c,
    id: generateId(),
  }));

  return {
    characters,
    sceneDescription: result.scene_description || "",
    actionSummary: result.action_summary || "",
    kinks: result.kinks || [],
  };
}
