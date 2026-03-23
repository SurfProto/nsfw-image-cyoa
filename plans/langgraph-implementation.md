# LangGraph.js Implementation Plan

## Architecture Overview

```
Next.js App (TypeScript)
├── Clerk Auth (middleware + providers)
├── Supabase (Postgres persistence + LangGraph checkpointer)
├── LangGraph.js (graph-based story engine in API routes)
└── OpenRouter (LLM/VLM calls)
```

## LangGraph State Schema

```typescript
// lib/graph/state.ts

import { Annotation } from "@langchain/langgraph";

export const StoryStateAnnotation = Annotation.Root({
  // Input
  imageDataUrls: Annotation<string[]>,
  modelConfig: Annotation<{ vlmModel: string; llmModel: string; temperature: number }>,

  // Extraction output
  characters: Annotation<Array<{
    id: string;
    name: string;
    appearance: string;
    personality: string;
    relationships: string;
  }>>,
  sceneDescription: Annotation<string>,
  actionSummary: Annotation<string>,
  kinks: Annotation<string[]>,

  // Generation output
  currentSceneText: Annotation<string>,
  choices: Annotation<string[]>,

  // Memory (accumulates across scenes)
  memories: Annotation<Array<{
    characterStates: Array<{
      characterId: string;
      name: string;
      emotionalState: string;
      relationshipChanges: string;
      keyTraits: string[];
    }>;
    location: {
      name: string;
      atmosphere: string;
      sensoryDetails: string[];
    } | null;
    plotThreads: Array<{
      description: string;
      tension: string;
      status: "open" | "resolved";
    }>;
    summary: string;
    keyDialogue: string[];
  }>>,

  // Branch tracking
  currentNodeId: Annotation<string>,
  parentNodeId: Annotation<string | null>,
  selectedChoiceIndex: Annotation<number | null>,
});
```

## Graph Nodes

### 1. `extractNode` — VLM Image Extraction
- Input: `imageDataUrls`, `modelConfig`
- Calls OpenRouter VLM for each image
- Merges results into unified `characters`, `sceneDescription`, `actionSummary`, `kinks`
- For single image: direct extraction
- For multi-image (Phase 4): parallel extraction + fusion

### 2. `generateNode` — LLM Scene Generation
- Input: `characters`, `sceneDescription`, `actionSummary`, `kinks`, `memories`, `modelConfig`
- Assembles memory context from `memories` array
- Calls OpenRouter LLM to generate scene text + 4 choices
- Output: `currentSceneText`, `choices`

### 3. `memoryNode` — Memory Extraction
- Input: `currentSceneText`, `characters`, `memories` (last entry)
- Calls OpenRouter LLM to extract structured memory
- Appends new `SceneMemory` to `memories` array
- Output: updated `memories`

## Graph Edges

```
START → extractNode → generateNode → memoryNode → END
```

For branching (user selects a choice):
- Create a new thread with `parentNodeId` set
- Copy relevant state from parent thread
- Continue from `generateNode` with accumulated memories

## Checkpointer Configuration

```typescript
// lib/graph/checkpointer.ts

import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

// Uses Supabase Postgres connection
export function createCheckpointer() {
  return PostgresSaver.fromConnString(process.env.DATABASE_URL!);
}
```

## API Routes

### `/api/graph/extract` (POST)
- Creates new thread or continues existing
- Runs `extractNode`
- Returns extracted data + thread_id

### `/api/graph/generate` (POST)
- Takes thread_id + optional choice index
- Runs `generateNode` → `memoryNode`
- Returns scene text, choices, updated state

### `/api/graph/branch` (POST)
- Takes thread_id + choice index
- Creates child thread with parent reference
- Runs `generateNode` → `memoryNode` on new thread
- Returns new thread_id + scene

## Supabase Schema

```sql
-- Stories table (Clerk user linked)
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Clerk user ID
  title TEXT,
  thread_id TEXT NOT NULL, -- LangGraph thread ID
  parent_thread_id TEXT, -- For branching
  image_data_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LangGraph checkpoints (managed by PostgresSaver)
-- This table is auto-created by LangGraph's checkpointer

-- Index for user queries
CREATE INDEX idx_stories_user ON stories(user_id);
```

## Clerk + Supabase Integration

### Middleware (`middleware.ts`)
```typescript
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### Layout (`app/layout.tsx`)
```typescript
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html>{children}</html>
    </ClerkProvider>
  );
}
```

### API Route Protection
```typescript
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... rest of handler
}
```

## Dependencies

```json
{
  "dependencies": {
    "@langchain/langgraph": "^0.2.x",
    "@langchain/langgraph-checkpoint-postgres": "^0.2.x",
    "@clerk/nextjs": "^5.x",
    "@supabase/supabase-js": "^2.x"
  }
}
```

## Implementation Order

### Step 1: Infrastructure
1. Install dependencies: `@langchain/langgraph`, `@clerk/nextjs`, `@supabase/supabase-js`
2. Set up Clerk: middleware, layout provider, env vars
3. Set up Supabase: create stories table, env vars
4. Create LangGraph checkpointer with Supabase Postgres

### Step 2: Graph Core
5. Create `lib/graph/state.ts` — StoryStateAnnotation
6. Create `lib/graph/nodes/extract.ts` — extractNode
7. Create `lib/graph/nodes/generate.ts` — generateNode
8. Create `lib/graph/nodes/memory.ts` — memoryNode
9. Create `lib/graph/graph.ts` — compile graph with edges

### Step 3: API Routes
10. Create `/api/graph/extract` — protected, runs extractNode
11. Create `/api/graph/generate` — protected, runs generateNode + memoryNode
12. Create `/api/graph/branch` — protected, creates child thread

### Step 4: Frontend Integration
13. Update `app/page.tsx` — use new graph API routes
14. Update state management — thread_id based instead of localStorage
15. Add Clerk sign-in/sign-out UI

### Step 5: Persistence
16. Story CRUD via Supabase (list, load, save, delete)
17. Auto-save on each graph step
18. Multi-device sync via Supabase

## Files Created/Modified

| File | Action |
|------|--------|
| `lib/graph/state.ts` | **New.** StoryStateAnnotation |
| `lib/graph/nodes/extract.ts` | **New.** extractNode |
| `lib/graph/nodes/generate.ts` | **New.** generateNode |
| `lib/graph/nodes/memory.ts` | **New.** memoryNode |
| `lib/graph/graph.ts` | **New.** Graph compilation |
| `lib/graph/checkpointer.ts` | **New.** PostgresSaver config |
| `lib/supabase.ts` | **New.** Supabase client |
| `app/api/graph/extract/route.ts` | **New.** Extract endpoint |
| `app/api/graph/generate/route.ts` | **New.** Generate endpoint |
| `app/api/graph/branch/route.ts` | **New.** Branch endpoint |
| `middleware.ts` | **New.** Clerk middleware |
| `app/layout.tsx` | **Modify.** Add ClerkProvider |
| `app/page.tsx` | **Modify.** Use graph API + Clerk auth |
| `types.ts` | **Modify.** Align with graph state |

## UX Impact

- **Sign-in required** — Clerk auth gate
- **Stories persist** — Supabase storage, multi-device sync
- **Smart memory** — characters evolve, locations persist, plot threads resurface
- **Branch-aware memory** — each branch has independent memory state
- **No phrase repetition** — memory extraction distills meaning, not verbatim text
