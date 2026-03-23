// LangGraph Node: Memory Extraction
// Extracts structured memory from generated scene

import type { StoryState, SceneMemoryState } from "../state";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callOpenRouter(
  model: string,
  messages: OpenRouterMessage[],
  temperature: number = 0.3
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
      max_tokens: 2048,
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
    console.error("Memory extraction raw response:", rawResponse);
    throw new Error("Failed to parse JSON from memory extraction response");
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Memory extraction raw response:", rawResponse);
    console.error("Extracted JSON string:", jsonMatch[0]);
    throw new Error(`Failed to parse JSON from memory extraction: ${e instanceof Error ? e.message : e}`);
  }
}

export async function memoryNode(state: StoryState): Promise<Partial<StoryState>> {
  const { currentSceneText, characters, memories, modelConfig } = state;

  if (!currentSceneText) {
    return { memories };
  }

  const previousMemory = memories.length > 0 ? memories[memories.length - 1] : null;

  const systemPrompt = `You are a story analysis assistant. Extract structured memory from a scene to track character states, locations, and plot threads. Return ONLY valid JSON.`;

  const userPrompt = `Analyze this scene and extract structured memory. Return ONLY valid JSON with this exact structure:
{
  "characterStates": [
    {
      "characterId": "id",
      "name": "name",
      "emotionalState": "current emotional state and mood",
      "relationshipChanges": "how relationships changed in this scene",
      "keyTraits": ["trait1", "trait2"]
    }
  ],
  "location": {
    "name": "location name",
    "atmosphere": "atmosphere description",
    "sensoryDetails": ["detail1", "detail2"]
  },
  "plotThreads": [
    {
      "description": "thread description",
      "tension": "tension level or direction",
      "status": "open"
    }
  ],
  "summary": "2-3 sentence condensed summary of what happened (capture meaning, not verbatim text)",
  "keyDialogue": ["memorable quote 1", "memorable quote 2"]
}

CHARACTERS IN SCENE:
${characters.map(c => `- ${c.id}: ${c.name}`).join("\n")}

${previousMemory ? `PREVIOUS MEMORY (track changes from this state):
${JSON.stringify(previousMemory, null, 2)}` : "This is the first scene — establish initial states."}

SCENE TEXT:
${currentSceneText}

Extract memory. Be specific about emotional states and relationship changes. Summary should capture meaning, not repeat scene text verbatim.`;

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const rawResponse = await callOpenRouter(modelConfig.llmModel, messages, 0.3);
  const parsed = parseJsonResponse(rawResponse);

  const newMemory: SceneMemoryState = {
    characterStates: (parsed.characterStates as SceneMemoryState["characterStates"]) || [],
    location: (parsed.location as SceneMemoryState["location"]) || null,
    plotThreads: (parsed.plotThreads as SceneMemoryState["plotThreads"]) || [],
    summary: (parsed.summary as string) || "",
    keyDialogue: (parsed.keyDialogue as string[]) || [],
  };

  return {
    memories: [...memories, newMemory],
  };
}
