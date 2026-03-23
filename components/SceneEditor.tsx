"use client";

import { Scene } from "@/types";
import { countWords } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

interface SceneEditorProps {
  scene: Scene;
  onChange: (scene: Scene) => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  isGenerated?: boolean;
}

export default function SceneEditor({
  scene,
  onChange,
  onRegenerate,
  isRegenerating = false,
  isGenerated = false,
}: SceneEditorProps) {
  const wordCount = countWords(scene.generatedText || "");
  const isInRange = wordCount >= 300 && wordCount <= 500;
  const isTooShort = wordCount > 0 && wordCount < 300;
  const isTooLong = wordCount > 500;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Scene
        </h3>
        {onRegenerate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="h-7 text-xs"
          >
            {isRegenerating ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-1" />
            )}
            Regenerate Scene
          </Button>
        )}
      </div>

      <div>
        <Label className="text-xs text-zinc-500">Scene Description</Label>
        <Textarea
          value={scene.description}
          onChange={(e) => onChange({ ...scene, description: e.target.value })}
          placeholder="Describe the current scene setting..."
          className="text-sm bg-zinc-800 border-zinc-700 min-h-[80px]"
        />
      </div>

      <div>
        <Label className="text-xs text-zinc-500">Current Action Summary</Label>
        <Textarea
          value={scene.actionSummary}
          onChange={(e) =>
            onChange({ ...scene, actionSummary: e.target.value })
          }
          placeholder="What is happening right now..."
          className="text-sm bg-zinc-800 border-zinc-700 min-h-[80px]"
        />
      </div>

      {isGenerated && scene.generatedText && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs text-zinc-500">Generated Scene</Label>
            <span
              className={`text-xs font-mono ${
                isInRange
                  ? "text-green-500"
                  : isTooShort
                    ? "text-yellow-500"
                    : isTooLong
                      ? "text-red-500"
                      : "text-zinc-500"
              }`}
            >
              {wordCount} / 300-500 words
            </span>
          </div>
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-md p-3 text-sm text-zinc-300 leading-relaxed max-h-[400px] overflow-y-auto">
            {scene.generatedText}
          </div>
        </div>
      )}
    </div>
  );
}
