# Phase 2: Character Management, Multi-Image Support & Memory System

## Overview
Extend core with advanced character handling and multi-image extraction.  
All operations remain extraction-only. Stories now support up to 10 images (comics) with coherent fusion.

## Key Features
- New dedicated Characters tab: list all characters, add/modify/delete anytime during story
- Player character: select from extracted characters or create manually (name + optional image/JSON)
- Multi-image upload: up to 10 images (or Silly Tavern PNG/JSON files)
- Parallel VLM extraction from all images → unified character sheets + locations + kinks
- Coherence node: LLM merges multiple extractions into single consistent story bible
- Silly Tavern import: parse embedded JSON metadata from PNG or direct JSON upload
- Memory system: store full history per story; generate summarized context for each new scene to ensure varied recall (no heavy phrase reuse)
- Add character mid-story via Characters tab (updates current and future nodes)
- Export includes full character sheets and multi-image references

## Data Model Updates
- StoryState adds: imageDataUrls: string[] (max 10), memories: string[], playerCharacterId: string
- Characters now have optional imageDataUrl and source ("extracted" | "manual" | "sillytavern")

## Implementation Steps
1. Extend Prisma schema: add imageDataUrls, memories JSONB field
2. Update types.ts with new fields
3. New component: CharactersTab.tsx (table + edit modals + Player selector)
4. Update ImageUploader to accept multiple files + drag-drop
5. New API: /api/extract-multi — accepts array, calls VLM in parallel, returns unified extraction
6. New API: /api/fuse-coherence — takes multiple extractions + returns merged bible
7. Update generate endpoint: inject summarized memory + coherence bible into prompt
8. Memory helper in lib/memory.ts: summarizePreviousScenes() to keep context fresh and varied
9. Update BranchTree and editors to read/write from Characters tab in real time
10. SillyTavern parser: utility function to extract character JSON from PNG base64 metadata or .json file
11. Full end-to-end test: 5-image comic → coherent story with editable characters and memory

Deliverable: Multi-image comic support + full character lifecycle + varied memory recall.