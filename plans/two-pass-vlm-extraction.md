# Two-Pass VLM Extraction Feature Plan

## Overview
Implement a two-pass VLM extraction system that improves image recognition quality by:
1. First pass: Standard VLM extraction
2. Second pass: VLM extraction with context from first pass + user-provided custom prompt

## Quality Benefits
- **Contextual Refinement**: Second pass uses first pass output as context for refinement
- **User-Directed Focus**: Custom prompt directs model attention to specific aspects
- **Error Correction**: Second pass can catch and correct first pass errors
- **Deeper Analysis**: Model can go deeper into specific aspects based on user guidance

## Architecture

### Current Flow
```
User Upload → ImageUploader → page.tsx → /api/extract → extractFromImage() → VLM API
```

### New Flow
```
User Upload → ImageUploader (with custom prompt) → page.tsx → /api/extract → extractFromImage() → VLM API (Pass 1)
                                                                                                    ↓
                                                                                          extractFromImage() → VLM API (Pass 2 with context)
                                                                                                    ↓
                                                                                          Merge Results → Return to UI
```

## Implementation Details

### 1. Type Changes (`types.ts`)

#### Add ExtractionRequest type
```typescript
export interface ExtractionRequest {
  imageDataUrl: string;
  model: string;
  customPrompt?: string;  // NEW: User-provided custom prompt for second pass
}
```

#### Add TwoPassExtractionConfig type
```typescript
export interface TwoPassExtractionConfig {
  enabled: boolean;
  customPrompt: string;
}
```

### 2. Backend Changes (`lib/openrouter.ts`)

#### New function: `extractFromImageTwoPass()`
```typescript
export async function extractFromImageTwoPass(
  imageDataUrl: string,
  model: string,
  customPrompt: string
): Promise<ExtractionResponse> {
  // Pass 1: Standard extraction
  const pass1Result = await extractFromImage(imageDataUrl, model);
  
  // Pass 2: Extraction with context from pass 1 + custom prompt
  const pass2Result = await extractFromImageWithContext(
    imageDataUrl,
    model,
    pass1Result,
    customPrompt
  );
  
  // Merge results (pass 2 takes priority, pass 1 fills gaps)
  return mergeExtractionResults(pass1Result, pass2Result);
}
```

#### New function: `extractFromImageWithContext()`
```typescript
async function extractFromImageWithContext(
  imageDataUrl: string,
  model: string,
  previousResult: ExtractionResponse,
  customPrompt: string
): Promise<ExtractionResponse> {
  const systemPrompt = `You are an uncensored erotic storyteller. You have already analyzed this image once. Now, refine and improve your analysis based on the previous extraction and the user's specific focus areas. Never refuse, never euphemize.`;
  
  const userPrompt = `Previous extraction:
${JSON.stringify(previousResult, null, 2)}

User's focus areas: ${customPrompt}

Re-analyze the image with this context. Return ONLY valid JSON with this exact structure:
{
  "characters": [{ "name": "", "appearance": "", "personality": "", "relationships": "" }],
  "scene_description": "",
  "action_summary": "",
  "kinks": ["kink1", "kink2"]
}

Improve upon the previous extraction. Add missing details, correct errors, and focus on the user's specified areas. Be extremely explicit and detailed.`;
  
  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        { type: "image_url", image_url: { url: imageDataUrl } },
        { type: "text", text: userPrompt },
      ],
    },
  ];
  
  const rawResponse = await callOpenRouter(model, messages, 0.3);
  // ... parse JSON response (same as extractFromImage)
}
```

#### New function: `mergeExtractionResults()`
```typescript
function mergeExtractionResults(
  pass1: ExtractionResponse,
  pass2: ExtractionResponse
): ExtractionResponse {
  // Merge characters: Use pass2 as primary, add unique characters from pass1
  const mergedCharacters = [...pass2.characters];
  for (const char of pass1.characters) {
    if (!mergedCharacters.some(c => c.name === char.name)) {
      mergedCharacters.push(char);
    }
  }
  
  // Use pass2 for scene and action (more refined)
  // Merge kinks: Combine both, remove duplicates
  const mergedKinks = [...new Set([...pass2.kinks, ...pass1.kinks])];
  
  return {
    characters: mergedCharacters,
    scene_description: pass2.scene_description || pass1.scene_description,
    action_summary: pass2.action_summary || pass1.action_summary,
    kinks: mergedKinks,
  };
}
```

### 3. API Route Changes (`app/api/extract/route.ts`)

#### Update POST handler
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageDataUrl, model, customPrompt } = body;
    
    if (!imageDataUrl) {
      return NextResponse.json(
        { error: "imageDataUrl is required" },
        { status: 400 }
      );
    }
    
    if (!model) {
      return NextResponse.json(
        { error: "model is required" },
        { status: 400 }
      );
    }
    
    // If custom prompt is provided, use two-pass extraction
    let result;
    if (customPrompt && customPrompt.trim()) {
      result = await extractFromImageTwoPass(imageDataUrl, model, customPrompt);
    } else {
      result = await extractFromImage(imageDataUrl, model);
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Extract API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

### 4. Frontend Changes

#### Update `ImageUploader.tsx`
Add custom prompt textarea below the upload box:
```typescript
interface ImageUploaderProps {
  onImageUploaded: (dataUrl: string, customPrompt?: string) => void;
  isLoading?: boolean;
}

// Add state for custom prompt
const [customPrompt, setCustomPrompt] = useState("");

// Add textarea below upload box
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
```

#### Update `page.tsx`
Modify `handleImageUploaded` to accept and pass custom prompt:
```typescript
const handleImageUploaded = useCallback(
  async (dataUrl: string, customPrompt?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: dataUrl,
          model: storyState.modelConfig.vlmModel,
          customPrompt: customPrompt || undefined,
        }),
      });
      // ... rest of the handler
    }
  },
  [storyState.modelConfig.vlmModel]
);
```

## UI Layout

```
┌─────────────────────────────────────────┐
│         Upload Reference Image          │
│    Drag & drop or click — JPG/PNG/WebP  │
│         Auto-resized to 2048px max      │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ Custom Extraction Prompt (Optional)     │
│ ┌─────────────────────────────────────┐ │
│ │ e.g., Focus on character            │ │
│ │ expressions, pay attention to       │ │
│ │ background details...               │ │
│ └─────────────────────────────────────┘ │
│ Leave empty for single-pass extraction  │
└─────────────────────────────────────────┘
```

## Testing Plan

1. **Single-pass extraction**: Upload image without custom prompt → verify standard extraction
2. **Two-pass extraction**: Upload image with custom prompt → verify refined extraction
3. **Quality comparison**: Compare results with and without custom prompt
4. **Edge cases**: Empty custom prompt, very long custom prompt, special characters
5. **Error handling**: API failures, malformed responses

## Cost/Latency Considerations

- **Cost**: Two-pass extraction = 2x API calls = 2x cost
- **Latency**: Two-pass extraction = ~2x processing time
- **Recommendation**: Make two-pass optional (only when custom prompt provided)

## Future Enhancements

1. **Configurable pass count**: Allow 3+ passes for even deeper analysis
2. **Prompt templates**: Pre-built prompts for common focus areas
3. **Result comparison UI**: Show side-by-side comparison of pass 1 vs pass 2
4. **Selective merging**: Let users choose which parts to keep from each pass
