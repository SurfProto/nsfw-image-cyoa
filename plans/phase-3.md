# Phase 3: Admin Panel, CYAO Tightening, Polish & Production Deploy

## Overview
Add moderation, admin tools, refined branching, and production deployment.  
All image handling remains extraction-only.

## Key Features
- Protected /admin route (Clerk role-based: admin only)
- Admin panel: user list, story overview, moderation queue (flag/delete NSFW violations), basic analytics (stories created, images processed, top kinks/models)
- CYAO tightening: undo/redo last choice, choice locking, branch pruning, export single branch as playable Markdown
- Improved export: full ZIP with index.md, per-scene files, embedded base64 images, character sheets, clickable branches
- Rate limiting and error handling for OpenRouter
- Multi-device sync via Postgres (continue story on phone/desktop)
- Age gate on signup (optional legal compliance)
- Final polish: loading states, error alerts, responsive layout, auto-save every 10s

## Implementation Steps
1. Clerk Organizations + Roles: create "admin" role in Clerk dashboard
2. New route: app/admin/page.tsx with TanStack Table for users and stories
3. API routes: /api/admin/users, /api/admin/stories (role-protected)
4. Webhooks: Clerk user.created → sync to Prisma
5. Update generate endpoint: enforce varied recall via memory summary; add branch management helpers
6. Enhance MarkdownExporter: support multi-image references and full character export
7. Add undo/redo to BranchTree using state history
8. Vercel deployment setup: environment variables, Prisma accelerate, Clerk domain config
9. Production safeguards: API key rotation, OpenRouter rate-limit handling, story size limits (max 10 images, 50 nodes)
10. Final testing: 10-image comic flow, admin moderation, multi-device resume, full export

## Deployment
- Vercel (frontend + serverless API)
- Neon / Supabase Postgres
- Environment: CLERK keys, DATABASE_URL, OPENROUTER_API_KEY

Deliverable: Fully production-ready web app with auth, admin, multi-image comics, and tight CYOA mechanics.