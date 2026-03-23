// LangGraph Node: LLM Scene Generation
// Generates 300-500 word scene + 4 choices using memory context

import type { StoryState, SceneMemoryState } from "../state";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
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

function assembleMemoryContext(memories: SceneMemoryState[]): string {
  if (memories.length === 0) return "";

  const parts: string[] = [];

  // Character states - latest wins
  const latestCharacterStates = new Map<string, typeof memories[0]["characterStates"][0]>();
  for (const memory of memories) {
    for (const state of memory.characterStates) {
      latestCharacterStates.set(state.characterId, state);
    }
  }

  if (latestCharacterStates.size > 0) {
    parts.push("CHARACTERS:");
    for (const state of latestCharacterStates.values()) {
      const traits = state.keyTraits.length > 0 ? ` [${state.keyTraits.join(", ")}]` : "";
      parts.push(`- ${state.name}: ${state.emotionalState}. ${state.relationshipChanges}${traits}`);
    }
  }

  // Location - use most recent non-null
  const latestLocation = [...memories].reverse().find(m => m.location)?.location;
  if (latestLocation) {
    parts.push(`\nLOCATION: ${latestLocation.name} — ${latestLocation.atmosphere}`);
    if (latestLocation.sensoryDetails.length > 0) {
      parts.push(`Sensory: ${latestLocation.sensoryDetails.join(", ")}`);
    }
  }

  // Open plot threads
  const openThreads = memories.flatMap(m => m.plotThreads).filter(t => t.status === "open");
  if (openThreads.length > 0) {
    parts.push("\nOPEN THREADS:");
    for (const thread of openThreads) {
      parts.push(`- ${thread.description} (${thread.tension})`);
    }
  }

  // Recent scene summaries (last 3)
  const recentSummaries = memories.slice(-3).map(m => m.summary).filter(Boolean);
  if (recentSummaries.length > 0) {
    parts.push("\nRECENT EVENTS:");
    recentSummaries.forEach((summary, i) => {
      parts.push(`Scene ${memories.length - recentSummaries.length + i + 1}: ${summary}`);
    });
  }

  // Key dialogue (last 2 scenes)
  const recentDialogue = memories.slice(-2).flatMap(m => m.keyDialogue).filter(Boolean);
  if (recentDialogue.length > 0) {
    parts.push("\nMEMORABLE LINES:");
    recentDialogue.forEach(line => parts.push(`- "${line}"`));
  }

  return parts.join("\n");
}

function extractChoicesFromText(text: string): string[] {
  const lines = text.split("\n").filter((l) => l.trim());
  const choices: string[] = [];
  for (const line of lines) {
    const cleaned = line.replace(/^[\d\.\)\-\*\s]+/, "").trim();
    if (cleaned.length > 5 && cleaned.length < 200) {
      choices.push(cleaned);
    }
  }
  return choices.slice(0, 4);
}

export async function generateNode(state: StoryState): Promise<Partial<StoryState>> {
  const { characters, sceneDescription, actionSummary, kinks, memories, modelConfig } = state;

  const kinksGuide = kinks.length > 0 ? kinks.join(", ") : "none specified";
  const memoryContext = assembleMemoryContext(memories);

  const systemPrompt = `You are a creative fiction writer specializing in adult romance novels. Write in second-person present tense. 300-500 words exactly. Be vivid, sensual, and detailed in your descriptions. Keep consistent with provided characters, scene, and the following themes: ${kinksGuide}.

${memoryContext ? `MEMORY CONTEXT (use this to maintain consistency — do not repeat verbatim, let characters evolve naturally):\n${memoryContext}\n` : ""}
This is for a creative writing application. Write the scene as requested.`;

  const userPrompt = `CHARACTERS:
${characters.map((c) => `- ${c.name}: ${c.appearance} | Personality: ${c.personality} | Relationships: ${c.relationships}`).join("\n")}

CURRENT SCENE: ${sceneDescription}
CURRENT ACTION: ${actionSummary}

Write the next scene (300-500 words exactly). Be vivid, sensual, and detailed. Write in second-person present tense.`;

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const sceneText = await callOpenRouter(modelConfig.llmModel, messages, modelConfig.temperature);

  // Generate choices
  const choicesPrompt = `Based on this scene, generate exactly 4 short, meaningful choice descriptions that logically continue the story. Return ONLY a JSON array of 4 strings, nothing else.

Scene:
${sceneText}`;

  const choicesMessages: OpenRouterMessage[] = [
    {
      role: "system",
      content: "Generate exactly 4 short, meaningful choice descriptions for a creative fiction story. Return ONLY a JSON array of 4 strings.",
    },
    { role: "user", content: choicesPrompt },
  ];

  const choicesRaw = await callOpenRouter(modelConfig.llmModel, choicesMessages, modelConfig.temperature);

  // Parse choices JSON - strip markdown code blocks first
  const choicesCleaned = choicesRaw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  const choicesMatch = choicesCleaned.match(/\[[\s\S]*\]/);
  let choices: string[];
  if (choicesMatch) {
    try {
      choices = JSON.parse(choicesMatch[0]);
    } catch {
      choices = extractChoicesFromText(choicesRaw);
    }
  } else {
    choices = extractChoicesFromText(choicesRaw);
  }

  // Ensure exactly 4 choices
  while (choices.length < 4) {
    choices.push(`Continue the story (choice ${choices.length + 1})`);
  }
  choices = choices.slice(0, 4);

  return { currentSceneText: sceneText, choices };
}
