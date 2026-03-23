// LangGraph Graph Compilation
// Defines the story generation graph with nodes and edges

import { StateGraph, START, END } from "@langchain/langgraph";
import { StoryStateAnnotation } from "./state";
import { extractNode } from "./nodes/extract";
import { generateNode } from "./nodes/generate";
import { memoryNode } from "./nodes/memory";

export function createStoryGraph() {
  const graph = new StateGraph(StoryStateAnnotation)
    // Add nodes
    .addNode("extract", extractNode)
    .addNode("generate", generateNode)
    .addNode("memory", memoryNode)

    // Define edges
    .addEdge(START, "extract")
    .addEdge("extract", "generate")
    .addEdge("generate", "memory")
    .addEdge("memory", END);

  return graph;
}

// Compile the graph with checkpointer for persistence
export async function compileStoryGraph() {
  const { createCheckpointer } = await import("./checkpointer");
  const checkpointer = createCheckpointer();

  const graph = createStoryGraph();
  return graph.compile({ checkpointer });
}

// Compile without checkpointer (for stateless operations)
export function compileStoryGraphStateless() {
  const graph = createStoryGraph();
  return graph.compile();
}
