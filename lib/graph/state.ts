// LangGraph State Schema for NSFW Image-to-CYOA
// Defines the shared state that flows through the graph nodes

import { Annotation } from "@langchain/langgraph";

// Character memory - evolving state per scene
export interface CharacterMemoryState {
  characterId: string;
  name: string;
  emotionalState: string;
  relationshipChanges: string;
  keyTraits: string[];
}

// Location memory
export interface LocationMemoryState {
  name: string;
  atmosphere: string;
  sensoryDetails: string[];
}

// Plot thread tracking
export interface PlotThreadState {
  description: string;
  tension: string;
  status: "open" | "resolved";
}

// Per-scene memory
export interface SceneMemoryState {
  characterStates: CharacterMemoryState[];
  location: LocationMemoryState | null;
  plotThreads: PlotThreadState[];
  summary: string;
  keyDialogue: string[];
}

// Model configuration
export interface ModelConfigState {
  vlmModel: string;
  llmModel: string;
  temperature: number;
}

// Main story state annotation for LangGraph
export const StoryStateAnnotation = Annotation.Root({
  // Input
  imageDataUrls: Annotation<string[]>,
  modelConfig: Annotation<ModelConfigState>,

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
  memories: Annotation<SceneMemoryState[]>,

  // Branch tracking
  currentNodeId: Annotation<string>,
  parentNodeId: Annotation<string | null>,
  selectedChoiceIndex: Annotation<number | null>,
});

export type StoryState = typeof StoryStateAnnotation.State;
