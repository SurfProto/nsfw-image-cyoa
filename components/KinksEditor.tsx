"use client";

import { useState } from "react";
import { KINK_COLORS } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

interface KinksEditorProps {
  kinks: string[];
  onChange: (kinks: string[]) => void;
}

export default function KinksEditor({ kinks, onChange }: KinksEditorProps) {
  const [newKink, setNewKink] = useState("");

  const addKink = () => {
    const trimmed = newKink.trim();
    if (trimmed && !kinks.includes(trimmed)) {
      onChange([...kinks, trimmed]);
      setNewKink("");
    }
  };

  const removeKink = (kink: string) => {
    onChange(kinks.filter((k) => k !== kink));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKink();
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
        Kinks & Tags
      </h3>

      <div className="flex gap-2">
        <Input
          value={newKink}
          onChange={(e) => setNewKink(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add kink..."
          className="h-8 text-sm bg-zinc-800 border-zinc-700"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={addKink}
          disabled={!newKink.trim()}
          className="h-8 px-3"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {kinks.length === 0 ? (
        <p className="text-zinc-500 text-xs italic">
          No kinks detected yet. Upload an image or add manually.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {kinks.map((kink, index) => (
            <Badge
              key={kink}
              variant="outline"
              className={`kink-badge cursor-pointer text-xs py-1 px-2 ${
                KINK_COLORS[index % KINK_COLORS.length]
              }`}
              onClick={() => removeKink(kink)}
            >
              {kink}
              <X className="w-3 h-3 ml-1 opacity-70 hover:opacity-100" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
