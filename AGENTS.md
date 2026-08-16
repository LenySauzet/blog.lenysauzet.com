# Agent Guidelines

The guidance for this repo lives in **[CLAUDE.md](./CLAUDE.md)**. Read it there.

This file exists so agents that look for `AGENTS.md` by convention find their way. It
holds no content of its own on purpose: it used to be a second copy of the project
description and drifted into contradicting the real one.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
