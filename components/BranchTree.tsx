"use client";

import { StoryNode } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, GitBranch } from "lucide-react";
import { useState } from "react";

interface BranchTreeProps {
  rootNode: StoryNode;
  currentNodeId: string;
  onNodeSelect: (nodeId: string) => void;
}

interface TreeNodeProps {
  node: StoryNode;
  currentNodeId: string;
  onNodeSelect: (nodeId: string) => void;
  depth?: number;
}

function TreeNode({
  node,
  currentNodeId,
  onNodeSelect,
  depth = 0,
}: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const isCurrent = node.id === currentNodeId;
  const hasChildren = node.children.length > 0;

  const previewText =
    node.scene.generatedText?.slice(0, 80) ||
    node.scene.description?.slice(0, 80) ||
    "Empty scene";

  return (
    <div className={`${depth > 0 ? "ml-3 border-l border-zinc-800 pl-2" : ""}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center gap-1 py-1">
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                {isOpen ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-5" />
          )}

          <button
            onClick={() => onNodeSelect(node.id)}
            className={`flex-1 text-left text-xs px-2 py-1 rounded transition-colors truncate ${
              isCurrent
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
            }`}
            title={previewText}
          >
            {previewText}...
          </button>
        </div>

        {hasChildren && (
          <CollapsibleContent>
            <div className="space-y-0.5">
              {node.children.map((child, index) => (
                <div key={child.id}>
                  {child.scene.generatedText && node.choices[index] && (
                    <div className="ml-5 text-[10px] text-zinc-600 italic truncate">
                      → {node.choices[index]}
                    </div>
                  )}
                  <TreeNode
                    node={child}
                    currentNodeId={currentNodeId}
                    onNodeSelect={onNodeSelect}
                    depth={depth + 1}
                  />
                </div>
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

export default function BranchTree({
  rootNode,
  currentNodeId,
  onNodeSelect,
}: BranchTreeProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-zinc-500" />
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Story Branches
        </h3>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 max-h-[400px] overflow-y-auto">
        <TreeNode
          node={rootNode}
          currentNodeId={currentNodeId}
          onNodeSelect={onNodeSelect}
        />
      </div>
    </div>
  );
}
