"use client";

import { useState, useEffect } from "react";
import { ModelConfig, VLM_MODELS, LLM_MODELS, DEFAULT_MODEL_CONFIG } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

interface ModelSelectorProps {
  config: ModelConfig;
  onChange: (config: ModelConfig) => void;
}

const STORAGE_KEY = "nsfw-cyoa-model-config";

export default function ModelSelector({ config, onChange }: ModelSelectorProps) {
  const [customVlm, setCustomVlm] = useState("");
  const [customLlm, setCustomLlm] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        onChange({ ...DEFAULT_MODEL_CONFIG, ...parsed });
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Ignore storage errors
    }
  }, [config]);

  const handleVlmChange = (value: string) => {
    if (value === "custom") {
      onChange({ ...config, vlmModel: customVlm || "" });
    } else {
      onChange({ ...config, vlmModel: value });
    }
  };

  const handleLlmChange = (value: string) => {
    if (value === "custom") {
      onChange({ ...config, llmModel: customLlm || "" });
    } else {
      onChange({ ...config, llmModel: value });
    }
  };

  const currentVlmValue = VLM_MODELS.some((m) => m.value === config.vlmModel)
    ? config.vlmModel
    : "custom";

  const currentLlmValue = LLM_MODELS.some((m) => m.value === config.llmModel)
    ? config.llmModel
    : "custom";

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
        Model Settings
      </h3>

      <div className="space-y-3">
        <div>
          <Label className="text-xs text-zinc-500">Vision Model (VLM)</Label>
          <Select value={currentVlmValue} onValueChange={handleVlmChange}>
            <SelectTrigger className="h-8 text-sm bg-zinc-800 border-zinc-700">
              <SelectValue placeholder="Select VLM" />
            </SelectTrigger>
            <SelectContent>
              {VLM_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentVlmValue === "custom" && (
            <Input
              value={customVlm || config.vlmModel}
              onChange={(e) => {
                setCustomVlm(e.target.value);
                onChange({ ...config, vlmModel: e.target.value });
              }}
              placeholder="Enter custom VLM model ID"
              className="h-8 text-sm bg-zinc-800 border-zinc-700 mt-1"
            />
          )}
        </div>

        <div>
          <Label className="text-xs text-zinc-500">Language Model (LLM)</Label>
          <Select value={currentLlmValue} onValueChange={handleLlmChange}>
            <SelectTrigger className="h-8 text-sm bg-zinc-800 border-zinc-700">
              <SelectValue placeholder="Select LLM" />
            </SelectTrigger>
            <SelectContent>
              {LLM_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentLlmValue === "custom" && (
            <Input
              value={customLlm || config.llmModel}
              onChange={(e) => {
                setCustomLlm(e.target.value);
                onChange({ ...config, llmModel: e.target.value });
              }}
              placeholder="Enter custom LLM model ID"
              className="h-8 text-sm bg-zinc-800 border-zinc-700 mt-1"
            />
          )}
        </div>

        <Separator className="bg-zinc-800" />

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-zinc-500">Temperature</Label>
            <span className="text-xs text-zinc-400 font-mono">
              {config.temperature.toFixed(1)}
            </span>
          </div>
          <Slider
            value={[config.temperature]}
            onValueChange={([value]) =>
              onChange({ ...config, temperature: value })
            }
            min={0}
            max={2}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
            <span>Precise</span>
            <span>Creative</span>
          </div>
        </div>
      </div>
    </div>
  );
}
