// API Route: /api/graph/generate
// Runs generate + memory nodes on the LangGraph story graph

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { compileStoryGraphStateless } from "@/lib/graph/graph";
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
      currentNodeId,
      parentNodeId,
    } = body;

    if (!characters || !sceneDescription || !modelConfig?.llmModel) {
      return NextResponse.json(
        { error: "characters, sceneDescription, and modelConfig are required" },
        { status: 400 }
      );
    }

    const graph = compileStoryGraphStateless();

    // Run only generate + memory nodes (skip extract)
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
      currentNodeId: currentNodeId || "",
      parentNodeId: parentNodeId || null,
      selectedChoiceIndex: null,
    });

    return NextResponse.json({
      sceneText: result.currentSceneText,
      choices: result.choices,
      memories: result.memories,
    });
  } catch (error) {
    console.error("Graph generate error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
