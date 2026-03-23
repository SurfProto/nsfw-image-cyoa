// API Route: /api/graph/extract
// Runs the extract node on the LangGraph story graph

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { compileStoryGraphStateless } from "@/lib/graph/graph";
import { generateId } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { imageDataUrls, modelConfig } = body;

    if (!imageDataUrls || imageDataUrls.length === 0) {
      return NextResponse.json(
        { error: "imageDataUrls is required" },
        { status: 400 }
      );
    }

    if (!modelConfig?.vlmModel) {
      return NextResponse.json(
        { error: "modelConfig.vlmModel is required" },
        { status: 400 }
      );
    }

    const graph = compileStoryGraphStateless();

    const result = await graph.invoke({
      imageDataUrls,
      modelConfig,
      characters: [],
      sceneDescription: "",
      actionSummary: "",
      kinks: [],
      currentSceneText: "",
      choices: [],
      memories: [],
      currentNodeId: generateId(),
      parentNodeId: null,
      selectedChoiceIndex: null,
    });

    return NextResponse.json({
      characters: result.characters,
      sceneDescription: result.sceneDescription,
      actionSummary: result.actionSummary,
      kinks: result.kinks,
      currentNodeId: result.currentNodeId,
    });
  } catch (error) {
    console.error("Graph extract error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
