"use client";

import { StoryNode, StoryState } from "@/types";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface MarkdownExporterProps {
  storyState: StoryState;
}

function collectScenes(node: StoryNode, scenes: StoryNode[] = []): StoryNode[] {
  if (node.scene.generatedText) {
    scenes.push(node);
  }
  for (const child of node.children) {
    collectScenes(child, scenes);
  }
  return scenes;
}

function generateSceneMarkdown(
  node: StoryNode,
  allNodes: Map<string, StoryNode>,
  imageDataUrl: string | null
): string {
  const lines: string[] = [];

  lines.push(`# Scene: ${node.id.slice(0, 8)}`);
  lines.push("");

  if (imageDataUrl && node.parentId === null) {
    lines.push(`![Reference Image](${imageDataUrl})`);
    lines.push("");
  }

  lines.push("## Description");
  lines.push(node.scene.description || "No description");
  lines.push("");

  lines.push("## Action");
  lines.push(node.scene.actionSummary || "No action summary");
  lines.push("");

  lines.push("## Story");
  lines.push(node.scene.generatedText || "No story generated yet");
  lines.push("");

  if (node.choices.length > 0) {
    lines.push("## Choices");
    lines.push("");
    for (let i = 0; i < node.choices.length; i++) {
      const childNode = node.children[i];
      if (childNode && childNode.scene.generatedText) {
        lines.push(
          `${i + 1}. [${node.choices[i]}](./${childNode.id.slice(0, 8)}.md)`
        );
      } else {
        lines.push(`${i + 1}. ${node.choices[i]}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

function generateIndexMarkdown(
  rootNode: StoryNode,
  scenes: StoryNode[]
): string {
  const lines: string[] = [];

  lines.push("# NSFW CYOA Story");
  lines.push("");
  lines.push(`Total scenes: ${scenes.length}`);
  lines.push("");
  lines.push("## Scenes");
  lines.push("");
  lines.push(`- [Start](./${rootNode.id.slice(0, 8)}.md)`);

  for (const scene of scenes) {
    if (scene.id !== rootNode.id) {
      const preview =
        scene.scene.generatedText?.slice(0, 50) || "Empty scene";
      lines.push(`- [${preview}...](./${scene.id.slice(0, 8)}.md)`);
    }
  }

  return lines.join("\n");
}

export default function MarkdownExporter({
  storyState,
}: MarkdownExporterProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const zip = new JSZip();
      const scenes = collectScenes(storyState.rootNode);

      // Build node map
      const nodeMap = new Map<string, StoryNode>();
      function buildMap(node: StoryNode) {
        nodeMap.set(node.id, node);
        for (const child of node.children) {
          buildMap(child);
        }
      }
      buildMap(storyState.rootNode);

      // Generate index.md
      zip.file("index.md", generateIndexMarkdown(storyState.rootNode, scenes));

      // Generate scene files
      for (const scene of scenes) {
        const filename = `${scene.id.slice(0, 8)}.md`;
        const content = generateSceneMarkdown(
          scene,
          nodeMap,
          storyState.imageDataUrl
        );
        zip.file(filename, content);
      }

      // Generate and download ZIP
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, "cyoa-story.zip");
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export story");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className="w-full"
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      Export as Playable Markdown Adventure
    </Button>
  );
}
