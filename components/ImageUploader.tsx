"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { resizeImage } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ImageUploaderProps {
  onImageUploaded: (dataUrl: string, customPrompt?: string) => void;
  isLoading?: boolean;
}

export default function ImageUploader({
  onImageUploaded,
  isLoading = false,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
        alert("Please upload a JPG, PNG, or WebP image");
        return;
      }

      try {
        const resized = await resizeImage(file, 2048);
        setPreview(resized);
        onImageUploaded(resized, customPrompt || undefined);
      } catch (error) {
        console.error("Image resize error:", error);
        alert("Failed to process image");
      }
    },
    [onImageUploaded, customPrompt]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 min-h-[200px] flex flex-col items-center justify-center
          ${
            isDragging
              ? "border-purple-500 bg-purple-500/10"
              : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900/50"
          }
          ${isLoading ? "pointer-events-none opacity-50" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            <p className="text-zinc-400">Extracting from image...</p>
          </div>
        ) : preview ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={preview}
              alt="Uploaded preview"
              className="max-h-[150px] rounded-lg object-contain"
            />
            <p className="text-zinc-400 text-sm">
              Click or drop to replace image
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {isDragging ? (
              <Upload className="w-12 h-12 text-purple-500" />
            ) : (
              <ImageIcon className="w-12 h-12 text-zinc-500" />
            )}
            <div>
              <p className="text-zinc-300 font-medium">
                Upload reference image
              </p>
              <p className="text-zinc-500 text-sm mt-1">
                Drag & drop or click — JPG/PNG/WebP
              </p>
              <p className="text-zinc-600 text-xs mt-1">
                Auto-resized to 2048px max
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="mt-4">
        <Label className="text-xs text-zinc-500">Custom Extraction Prompt (Optional)</Label>
        <Textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="e.g., Focus on character expressions, pay attention to background details, describe clothing in detail..."
          className="mt-1 bg-zinc-800 border-zinc-700 text-sm"
          rows={3}
        />
        <p className="text-xs text-zinc-600 mt-1">
          Leave empty for single-pass extraction. Provide focus areas for two-pass refinement.
        </p>
      </div>
    </div>
  );
}
