"use client";

import { Character } from "@/types";
import { generateId } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, RefreshCw } from "lucide-react";

interface CharacterEditorProps {
  characters: Character[];
  onChange: (characters: Character[]) => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export default function CharacterEditor({
  characters,
  onChange,
  onRegenerate,
  isRegenerating = false,
}: CharacterEditorProps) {
  const updateCharacter = (
    id: string,
    field: keyof Omit<Character, "id">,
    value: string
  ) => {
    onChange(
      characters.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const deleteCharacter = (id: string) => {
    onChange(characters.filter((c) => c.id !== id));
  };

  const addCharacter = () => {
    onChange([
      ...characters,
      {
        id: generateId(),
        name: "",
        appearance: "",
        personality: "",
        relationships: "",
      },
    ]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Characters
        </h3>
        <div className="flex gap-2">
          {onRegenerate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="h-7 text-xs"
            >
              <RefreshCw
                className={`w-3 h-3 mr-1 ${isRegenerating ? "animate-spin" : ""}`}
              />
              Regenerate
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={addCharacter}
            className="h-7 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {characters.length === 0 ? (
        <p className="text-zinc-500 text-sm italic">
          No characters yet. Upload an image or add manually.
        </p>
      ) : (
        <div className="space-y-3">
          {characters.map((char, index) => (
            <Card key={char.id} className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-zinc-300">
                    Character {index + 1}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCharacter(char.id)}
                    className="h-6 w-6 p-0 text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3">
                <div>
                  <Label className="text-xs text-zinc-500">Name</Label>
                  <Input
                    value={char.name}
                    onChange={(e) =>
                      updateCharacter(char.id, "name", e.target.value)
                    }
                    placeholder="Character name"
                    className="h-8 text-sm bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-500">Appearance</Label>
                  <Textarea
                    value={char.appearance}
                    onChange={(e) =>
                      updateCharacter(char.id, "appearance", e.target.value)
                    }
                    placeholder="Physical description..."
                    className="text-sm bg-zinc-800 border-zinc-700 min-h-[60px] resize-none"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-500">
                    Personality & Attitude
                  </Label>
                  <Textarea
                    value={char.personality}
                    onChange={(e) =>
                      updateCharacter(char.id, "personality", e.target.value)
                    }
                    placeholder="Personality traits..."
                    className="text-sm bg-zinc-800 border-zinc-700 min-h-[60px] resize-none"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-500">Relationships</Label>
                  <Textarea
                    value={char.relationships}
                    onChange={(e) =>
                      updateCharacter(char.id, "relationships", e.target.value)
                    }
                    placeholder="Relationships with other characters..."
                    className="text-sm bg-zinc-800 border-zinc-700 min-h-[60px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
