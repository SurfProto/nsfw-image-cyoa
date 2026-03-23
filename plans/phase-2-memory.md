# Phase 2: Smart Memory System

## Problem

Current architecture passes raw previous scene text as context (`previousScenes: string[]`), causing:
- Verbatim repetition of phrases from character sheets
- No structured tracking of character emotional states, location atmosphere, or plot threads
- Context window bloat with full scene text
- Characters feel static across scenes

## Goal

Add structured memory extraction + retrieval so characters evolve naturally, locations stay consistent, and plot threads resurface — without repeating the same phrases.

---

## New Types (`types.ts`)

```typescript
// Per-character evolving state within a scene
interface CharacterMemory {
  characterId: string;
  name: string;
  emotionalState: string;       // "angry at X", "aroused", "nervous"
  relationshipChanges: string;  // "now trusts Y", "tension with Z"
  keyTraits: string[];          // traits that emerged in this scene
}

// Location/atmosphere tracking
interface LocationMemory {
  name: string;
  atmosphere: string;           // "dimly lit bedroom", "cold dungeon"
  sensoryDetails: string[];     // smells, sounds, textures
}

// Unresolved narrative threads
interface PlotThread {
  description: string;          // "the secret letter hasn't been opened"
  tension: string;              // "building sexual tension between A and B"
  status: "open" | "resolved";
}

// Per-node memory (stored on StoryNode)
interface SceneMemory {
  characterStates: CharacterMemory[];
  location: LocationMemory | null;
  plotThreads: PlotThread[];
  summary: string;              // 2-3 sentence condensed summary
  keyDialogue: string[];        // memorable quotes/lines (max 3)
}
```

**Modify `StoryNode`:** Add optional `memory?: SceneMemory` field.

**Modify `GenerationRequest`:** Replace `previousScenes: string[]` with `memoryContext: string`.

---

## New File: `lib/memory.ts`

### `assembleMemoryContext(rootNode, targetNodeId): string`

Walks the branch from root to target node, collects all `SceneMemory` objects, and builds a compact context string:

```
CHARACTERS:
- Alice: aroused, trusting Bob, hiding jealousy
- Bob: dominant, protective of Alice

LOCATION: dimly lit bedroom, silk sheets, candlelight

OPEN THREADS:
- the secret letter hasn't been opened
- building tension between Alice and Bob

RECENT EVENTS:
Scene 1: Alice discovered the letter under the pillow...
Scene 2: Bob entered the room, noticed Alice's hesitation...
```

Rules:
- Character states: latest wins (most recent scene overrides)
- Location: use most recent non-null
- Plot threads: carry forward all "open" threads
- Summaries: include last 3 scenes max (older ones drop off)
- Key dialogue: include last 2 scenes max

---

## New Function: `extractMemory()` in `lib/openrouter.ts`

```typescript
export async function extractMemory(
  sceneText: string,
  characters: Character[],
  previousMemory: SceneMemory | null,
  model: string,
  temperature: number
): Promise<SceneMemory>
```

Prompt design:
- Input: scene text + character list + optional previous memory
- Output: `SceneMemory` JSON
- Instructions:
  - Track how each character's emotional state changed from previous memory
  - Note location details (name, atmosphere, sensory)
  - Identify open plot threads (new or continued)
  - Write a 2-3 sentence summary that captures meaning, not verbatim text
  - Extract 1-3 memorable dialogue lines

---

## New API Route: `app/api/memory/route.ts`

POST `/api/memory`
- Accepts: `{ sceneText, characters, previousMemory?, model, temperature }`
- Calls `extractMemory()`
- Returns `SceneMemory`

---

## Changes to `app/page.tsx`

In `handleGenerateScene()`:
1. After scene generation succeeds, call `/api/memory` with the new scene text
2. Store returned `SceneMemory` on the current node
3. Pass `memoryContext` (from `assembleMemoryContext()`) instead of `previousScenes` to `/api/generate`

---

## Changes to `lib/openrouter.ts` — `generateScene()`

Replace `previousScenes: string[]` parameter with `memoryContext: string`.

Update system prompt:
```
You are a creative fiction writer. Use the following memory context to maintain consistency:

{memoryContext}

Write the next scene. Reference character states, locations, and plot threads naturally — do not repeat the memory context verbatim. Let characters evolve based on what happened.
```

---

## Changes to `app/api/generate/route.ts`

Accept `memoryContext` instead of `previousScenes` in the request body.

---

## Files Modified/Created

| File | Action |
|------|--------|
| `types.ts` | Add `CharacterMemory`, `LocationMemory`, `PlotThread`, `SceneMemory`. Add `memory?` to `StoryNode`. Update `GenerationRequest`. |
| `lib/memory.ts` | **New.** `assembleMemoryContext()` helper. |
| `lib/openrouter.ts` | Add `extractMemory()`. Update `generateScene()` signature and prompt. |
| `app/api/memory/route.ts` | **New.** Memory extraction endpoint. |
| `app/api/generate/route.ts` | Accept `memoryContext` instead of `previousScenes`. |
| `app/page.tsx` | Call memory extraction after scene gen. Pass `memoryContext` to generate API. |

---

## Implementation Order

1. Add types to `types.ts`
2. Create `lib/memory.ts` with `assembleMemoryContext()`
3. Add `extractMemory()` to `lib/openrouter.ts`
4. Create `app/api/memory/route.ts`
5. Update `app/api/generate/route.ts` to accept `memoryContext`
6. Update `generateScene()` in `lib/openrouter.ts` to use `memoryContext`
7. Update `app/page.tsx` to call memory extraction and pass `memoryContext`

---

## UX Impact

- **No visible UI changes** — memory works behind the scenes
- **Characters evolve naturally** — emotional states tracked, no verbatim personality repeats
- **Locations stay consistent** — atmosphere persists without repetition
- **Plot threads resurface** — unresolved tensions reappear organically
- **Branch-aware** — each branch maintains its own memory state
- **Smaller context window** — structured memory is more compact than raw scene text
