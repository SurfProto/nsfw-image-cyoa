"use client";

import { useState, useEffect, useCallback } from "react";
import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import {
  StoryState,
  StoryNode,
  Character,
  Scene,
  ModelConfig,
  DEFAULT_MODEL_CONFIG,
} from "@/types";
import type { SceneMemoryState } from "@/lib/graph/state";
import { generateId, countWords } from "@/lib/utils";
import ImageUploader from "@/components/ImageUploader";
import CharacterEditor from "@/components/CharacterEditor";
import SceneEditor from "@/components/SceneEditor";
import KinksEditor from "@/components/KinksEditor";
import BranchTree from "@/components/BranchTree";
import ModelSelector from "@/components/ModelSelector";
import MarkdownExporter from "@/components/MarkdownExporter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Save,
  FolderOpen,
  FilePlus,
  Download,
  AlertCircle,
  Loader2,
  Sparkles,
  LogIn,
  LogOut,
} from "lucide-react";

const STORAGE_KEY = "nsfw-cyoa-story";

function createEmptyScene(): Scene {
  return {
    id: generateId(),
    description: "",
    actionSummary: "",
    generatedText: "",
    wordCount: 0,
  };
}

function createEmptyNode(parentId: string | null = null): StoryNode {
  return {
    id: generateId(),
    parentId,
    scene: createEmptyScene(),
    choices: [],
    children: [],
    selectedChoiceIndex: null,
  };
}

function createEmptyState(): StoryState {
  return {
    id: generateId(),
    characters: [],
    rootNode: createEmptyNode(),
    currentNodeId: "",
    kinks: [],
    imageDataUrl: null,
    modelConfig: { ...DEFAULT_MODEL_CONFIG },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function findNode(root: StoryNode, nodeId: string): StoryNode | null {
  if (root.id === nodeId) return root;
  for (const child of root.children) {
    const found = findNode(child, nodeId);
    if (found) return found;
  }
  return null;
}

function collectPreviousScenes(
  root: StoryNode,
  targetId: string
): string[] {
  const scenes: string[] = [];

  function traverse(node: StoryNode, path: string[]): boolean {
    const currentPath = [...path];
    if (node.scene.generatedText) {
      currentPath.push(node.scene.generatedText);
    }

    if (node.id === targetId) {
      scenes.push(...currentPath.slice(0, -1));
      return true;
    }

    for (const child of node.children) {
      if (traverse(child, currentPath)) return true;
    }

    return false;
  }

  traverse(root, []);
  return scenes;
}

export default function Home() {
  const { isSignedIn } = useUser();
  const [storyState, setStoryState] = useState<StoryState>(createEmptyState);
  const [memories, setMemories] = useState<SceneMemoryState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasExtracted, setHasExtracted] = useState(false);

  // Initialize currentNodeId
  useEffect(() => {
    if (!storyState.currentNodeId && storyState.rootNode.id) {
      setStoryState((prev) => ({
        ...prev,
        currentNodeId: prev.rootNode.id,
      }));
    }
  }, [storyState.currentNodeId, storyState.rootNode.id]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setStoryState(parsed);
        if (parsed.characters?.length > 0) setHasExtracted(true);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storyState));
    } catch {
      // Ignore storage errors
    }
  }, [storyState]);

  const currentNode = findNode(storyState.rootNode, storyState.currentNodeId);

  const handleImageUploaded = useCallback(
    async (dataUrl: string, customPrompt?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/graph/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageDataUrls: [dataUrl],
            modelConfig: storyState.modelConfig,
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Extraction failed");
        }

        const data = await response.json();

        const characters: Character[] = (data.characters || []).map(
          (c: Omit<Character, "id">) => ({
            ...c,
            id: generateId(),
          })
        );

        setStoryState((prev) => ({
          ...prev,
          imageDataUrl: dataUrl,
          characters,
          kinks: data.kinks || [],
          rootNode: {
            ...prev.rootNode,
            scene: {
              ...prev.rootNode.scene,
              description: data.sceneDescription || "",
              actionSummary: data.actionSummary || "",
            },
          },
          updatedAt: Date.now(),
        }));

        setHasExtracted(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Extraction failed");
      } finally {
        setIsLoading(false);
      }
    },
    [storyState.modelConfig]
  );

  const handleRegenerateExtraction = useCallback(async () => {
    if (!storyState.imageDataUrl) return;
    await handleImageUploaded(storyState.imageDataUrl);
  }, [storyState.imageDataUrl, handleImageUploaded]);

  const handleGenerateScene = useCallback(async () => {
    if (!currentNode) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/graph/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characters: storyState.characters,
          sceneDescription: currentNode.scene.description,
          actionSummary: currentNode.scene.actionSummary,
          kinks: storyState.kinks,
          memories,
          modelConfig: storyState.modelConfig,
          currentNodeId: currentNode.id,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Generation failed");
      }

      const data = await response.json();

      // Update memories from graph response
      if (data.memories) {
        setMemories(data.memories);
      }

      setStoryState((prev) => {
        const root = JSON.parse(JSON.stringify(prev.rootNode));
        const node = findNode(root, prev.currentNodeId);
        if (!node) return prev;

        node.scene.generatedText = data.sceneText;
        node.scene.wordCount = countWords(data.sceneText);
        node.choices = data.choices;

        // Create child nodes for each choice
        node.children = data.choices.map(() => createEmptyNode(node.id));

        return { ...prev, rootNode: root, updatedAt: Date.now() };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }, [currentNode, storyState, memories]);

  const handleChoiceSelect = useCallback(
    async (choiceIndex: number) => {
      if (!currentNode || currentNode.children.length === 0) return;

      const childNode = currentNode.children[choiceIndex];
      if (!childNode) return;

      // Update selected choice
      setStoryState((prev) => {
        const root = JSON.parse(JSON.stringify(prev.rootNode));
        const node = findNode(root, prev.currentNodeId);
        if (!node) return prev;
        node.selectedChoiceIndex = choiceIndex;
        return {
          ...prev,
          rootNode: root,
          currentNodeId: childNode.id,
          updatedAt: Date.now(),
        };
      });

      // Generate scene for the new node
      setTimeout(() => {
        handleGenerateScene();
      }, 100);
    },
    [currentNode, handleGenerateScene]
  );

  const handleNodeSelect = useCallback((nodeId: string) => {
    setStoryState((prev) => ({
      ...prev,
      currentNodeId: nodeId,
    }));
  }, []);

  const handleSaveJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(storyState, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cyoa-story-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [storyState]);

  const handleLoadJSON = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          setStoryState(data);
          if (data.characters?.length > 0) setHasExtracted(true);
        } catch {
          setError("Invalid JSON file");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const handleNewStory = useCallback(() => {
    if (confirm("Start a new story? Current progress will be lost.")) {
      setStoryState(createEmptyState());
      setMemories([]);
      setHasExtracted(false);
      setError(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const handleExportBranch = useCallback(() => {
    if (!currentNode) return;

    const data = {
      scene: currentNode.scene,
      choices: currentNode.choices,
      characters: storyState.characters,
      kinks: storyState.kinks,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `branch-${currentNode.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentNode, storyState.characters, storyState.kinks]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 px-4 py-3">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-zinc-200">
            NSFW Image-to-CYOA
          </h1>
          <div className="flex items-center gap-2">
            {isSignedIn ? (
              <SignOutButton>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <LogOut className="w-3 h-3 mr-1" />
                  Sign Out
                </Button>
              </SignOutButton>
            ) : (
              <SignInButton mode="modal">
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <LogIn className="w-3 h-3 mr-1" />
                  Sign In
                </Button>
              </SignInButton>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveJSON}
              className="h-8 text-xs"
            >
              <Save className="w-3 h-3 mr-1" />
              Save JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadJSON}
              className="h-8 text-xs"
            >
              <FolderOpen className="w-3 h-3 mr-1" />
              Load JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewStory}
              className="h-8 text-xs"
            >
              <FilePlus className="w-3 h-3 mr-1" />
              New Story
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportBranch}
              className="h-8 text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Export Branch
            </Button>
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="max-w-[1800px] mx-auto px-4 pt-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Layout */}
      <div className="max-w-[1800px] mx-auto p-4 grid grid-cols-[280px_1fr_300px] gap-4 h-[calc(100vh-60px)]">
        {/* Left Sidebar */}
        <ScrollArea className="h-full">
          <div className="space-y-6 pr-2">
            {/* Image Upload */}
            {!hasExtracted && (
              <ImageUploader
                onImageUploaded={handleImageUploaded}
                isLoading={isLoading}
              />
            )}

            {/* Character Editor */}
            {hasExtracted && (
              <CharacterEditor
                characters={storyState.characters}
                onChange={(characters) =>
                  setStoryState((prev) => ({
                    ...prev,
                    characters,
                    updatedAt: Date.now(),
                  }))
                }
                onRegenerate={handleRegenerateExtraction}
                isRegenerating={isLoading}
              />
            )}

            <Separator className="bg-zinc-800" />

            {/* Branch Tree */}
            {storyState.rootNode.scene.generatedText && (
              <BranchTree
                rootNode={storyState.rootNode}
                currentNodeId={storyState.currentNodeId}
                onNodeSelect={handleNodeSelect}
              />
            )}
          </div>
        </ScrollArea>

        {/* Center Main Area */}
        <ScrollArea className="h-full">
          <div className="space-y-6 pr-2">
            {/* Image preview after extraction */}
            {hasExtracted && storyState.imageDataUrl && (
              <div className="flex justify-center">
                <img
                  src={storyState.imageDataUrl}
                  alt="Reference"
                  className="max-h-[200px] rounded-lg border border-zinc-800"
                />
              </div>
            )}

            {/* Scene Editor */}
            {currentNode && (
              <SceneEditor
                scene={currentNode.scene}
                onChange={(scene) =>
                  setStoryState((prev) => {
                    const root = JSON.parse(JSON.stringify(prev.rootNode));
                    const node = findNode(root, prev.currentNodeId);
                    if (!node) return prev;
                    node.scene = scene;
                    return { ...prev, rootNode: root, updatedAt: Date.now() };
                  })
                }
                onRegenerate={
                  currentNode.scene.generatedText
                    ? handleGenerateScene
                    : undefined
                }
                isRegenerating={isGenerating}
                isGenerated={!!currentNode.scene.generatedText}
              />
            )}

            {/* Generate Button */}
            {currentNode && !currentNode.scene.generatedText && (
              <div className="flex justify-center">
                <Button
                  onClick={handleGenerateScene}
                  disabled={isGenerating}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generate Scene
                </Button>
              </div>
            )}

            {/* Choices */}
            {currentNode && currentNode.choices.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                  What do you do?
                </h3>
                <div className="grid gap-2">
                  {currentNode.choices.map((choice, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => handleChoiceSelect(index)}
                      className="justify-start text-left h-auto py-3 px-4 bg-zinc-900/50 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600"
                    >
                      <span className="text-purple-400 mr-2 font-mono">
                        {index + 1}.
                      </span>
                      {choice}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Right Sidebar */}
        <ScrollArea className="h-full">
          <div className="space-y-6 pl-2">
            {/* Model Selector */}
            <ModelSelector
              config={storyState.modelConfig}
              onChange={(modelConfig) =>
                setStoryState((prev) => ({
                  ...prev,
                  modelConfig,
                  updatedAt: Date.now(),
                }))
              }
            />

            <Separator className="bg-zinc-800" />

            {/* Kinks Editor */}
            <KinksEditor
              kinks={storyState.kinks}
              onChange={(kinks) =>
                setStoryState((prev) => ({
                  ...prev,
                  kinks,
                  updatedAt: Date.now(),
                }))
              }
            />

            <Separator className="bg-zinc-800" />

            {/* Markdown Export */}
            <MarkdownExporter storyState={storyState} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
