# Phase 1: Project Setup, Authentication & Core Single-Image Flow

## Overview
Production-ready Next.js 15 (App Router) base for NSFW Image-to-CYOA generator.  
All image handling is extraction-only (single image or later multi/comic). No image generation.  
Stories are private per authenticated user and persisted in Postgres.

## Key Features
- Clerk authentication (email/password, social logins, magic links, MFA)
- Protected routes and API endpoints
- Single image upload (PNG/JPG/WebP) with Canvas resize (max 2048px longest side)
- VLM extraction: characters (name, appearance, personality, relationships), scene_description, action_summary, kinks[]
- Editable CharacterEditor, SceneEditor, KinksEditor
- Story generation: 300-500 word explicit second-person scene + exactly 4 choices
- Simple collapsible BranchTree for navigation
- Model selector (VLM + LLM) with temperature slider
- Per-user JSON save/load and auto-draft in session
- Dark erotic theme (slate-950 base, purple/crimson accents)

## Data Model (core)
- StoryState: id, userId, characters[], rootNode, currentNodeId, kinks[], imageDataUrl, modelConfig, createdAt, updatedAt
- StoryNode: id, parentId, scene, choices[], children[], selectedChoiceIndex

## Tech Stack
- Next.js 15 App Router + TypeScript
- Clerk (@clerk/nextjs)
- Prisma + PostgreSQL
- OpenRouter (direct calls via lib/openrouter.ts)
- shadcn/ui + Tailwind + lucide-react
- JSZip + file-saver for export

## Implementation Steps
1. `npx create-next-app@latest nsfw-image-cyoa --typescript --tailwind --eslint --app`
2. Install: `@clerk/nextjs prisma @prisma/client lucide-react jszip file-saver`
3. `npx shadcn-ui@latest init` + add button, card, textarea, badge, collapsible, etc.
4. Set up Clerk: middleware.ts, layout.tsx providers, env vars (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY)
5. Prisma schema: UserStory table linked to Clerk userId
6. types.ts: full StoryState, ExtractionResponse, GenerationResponse interfaces
7. lib/openrouter.ts: extractFromImage() and generateScene() with exact NSFW prompts (extraction-only, explicit, JSON output)
8. API routes: /api/extract (protected), /api/generate (protected)
9. Components: ImageUploader, CharacterEditor, SceneEditor, KinksEditor, BranchTree, ModelSelector
10. app/page.tsx: 3-column layout, state with useState + Prisma sync on save
11. Test: full single-image flow end-to-end with auth

Deliverable: Fully working single-image CYOA with login and persistent stories.