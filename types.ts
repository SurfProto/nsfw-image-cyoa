// Character extracted from image or manually edited
export interface Character {
  id: string;
  name: string;
  appearance: string;
  personality: string;
  relationships: string;
}

// Scene data
export interface Scene {
  id: string;
  description: string;
  actionSummary: string;
  generatedText: string;
  wordCount: number;
}

// Story node for branch tree
export interface StoryNode {
  id: string;
  parentId: string | null;
  scene: Scene;
  choices: string[];
  children: StoryNode[];
  selectedChoiceIndex: number | null;
}

// Model configuration
export interface ModelConfig {
  vlmModel: string;
  llmModel: string;
  temperature: number;
}

// Full story state
export interface StoryState {
  id: string;
  characters: Character[];
  rootNode: StoryNode;
  currentNodeId: string;
  kinks: string[];
  imageDataUrl: string | null;
  modelConfig: ModelConfig;
  createdAt: number;
  updatedAt: number;
}

// API response types
export interface ExtractionResponse {
  characters: Omit<Character, "id">[];
  scene_description: string;
  action_summary: string;
  kinks: string[];
}

export interface GenerationRequest {
  characters: Character[];
  scene: Scene;
  kinks: string[];
  previousScenes: string[];
  model: string;
  temperature: number;
}

export interface GenerationResponse {
  sceneText: string;
  choices: string[];
}

// API request types
export interface ExtractionRequest {
  imageDataUrl: string;
  model: string;
  customPrompt?: string;  // User-provided custom prompt for two-pass extraction
}

// Preloaded VLM models
export const VLM_MODELS = [
  { label: "Grok 4.1 Fast", value: "x-ai/grok-4.1-fast" },
  { label: "Qwen3 VL 32B", value: "qwen/qwen3-vl-32b-instruct" },
  { label: "Qwen2.5 VL 72B", value: "qwen/qwen2.5-vl-72b-instruct" },
  { label: "Llama 3.2 11B Vision", value: "meta-llama/llama-3.2-11b-vision-instruct" },
  { label: "Custom", value: "custom" },
] as const;

// Preloaded LLM models
export const LLM_MODELS = [
  { label: "Grok 4.20 Beta", value: "x-ai/grok-4.20-beta" },
  { label: "Grok 4.1 Fast", value: "x-ai/grok-4.1-fast" },
  { label: "Qwen3 70B", value: "qwen/qwen3-70b" },
  { label: "Llama 3.3 70B", value: "meta-llama/llama-3.3-70b-instruct" },
  { label: "Mixtral 8x22B", value: "mistralai/mixtral-8x22b-instruct" },
  { label: "Custom", value: "custom" },
] as const;

// Default model config
export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  vlmModel: "qwen/qwen3-vl-32b-instruct",
  llmModel: "x-ai/grok-4.20-beta",
  temperature: 0.7,
};

// Kink color palette for badges
export const KINK_COLORS = [
  "bg-red-500/20 text-red-300 border-red-500/30",
  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "bg-green-500/20 text-green-300 border-green-500/30",
  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  "bg-rose-500/20 text-rose-300 border-rose-500/30",
];
