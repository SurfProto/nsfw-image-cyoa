// API Route: /api/graph/branch
// Creates a new branch from a parent node

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { compileStoryGraphStateless } from "@/lib/graph/graph";
import { generateId } from "@/lib/utils";
import type { SceneMemoryState, ModelConfigState } from "@/lib/graph/state";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      characters,
      sceneDescription,
      actionSummary,
      kinks,
      memories,
      modelConfig,
      parentNodeId,
      selectedChoiceIndex,
    } = body;

    if (!characters || !modelConfig?.llmModel) {
      return NextResponse.json(
        { error: "characters and modelConfig are required" },
        { status: 400 }
      );
    }

    const newnodeId = generateId();

    const graph = compileStoryGraphStateless();

    // Run generate + memory on new branch
    const result = await graph.invoke({
      imageDataUrls: [],
      modelConfig: modelConfig as ModelConfigState,
      characters,
      sceneDescription: sceneDescription || "",
      actionSummary: actionSummary || "",
      kinks: kinks || [],
      currentSceneText: "",
      choices: [],
      memories: (memories || []) as SceneMemoryState[],
      currentNodeId: newnodeId,
      parentNodeId: parentNodeId || null,
      selectedChoiceIndex: selectedChoiceIndex ?? null,
    });

    return NextResponse.json({
      nodeId: newnodeId,
      sceneText: result.currentSceneText,
      choices: result.choices,
      memories: result.memories,
    });
  } catch (error) {
    console.error("Graph branch error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
