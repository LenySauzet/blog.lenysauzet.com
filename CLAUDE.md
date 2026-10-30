# CLAUDE.md

Guidance for Claude Code and every other agent working in this repo. `AGENTS.md` and
`.cursor/rules/general.mdc` point here. This file holds what every task needs; the rest
loads when it is relevant, through the routing tables at the end. **Before touching a
path, read the rule that covers it; before a task, load its skill.**

## Commands

```bash
bun dev              # Development server
portless             # The same, at https://blog.lenysauzet.localhost
bun run build        # Production build
bun start            # Serve the production build
bun lint             # ESLint (eslint-config-next)
bun run type-check   # tsc --noEmit
bun run test         # Vitest, single run
bun run test:watch
bun run tweet-videos # Copy the videos of embedded posts on X to the CDN
```

`bun test` runs Bun's own runner and will **not** work. Always `bun run test`.

## Tools

- **portless** puts the dev server behind a stable HTTPS name, set in `portless.json`.
  It is installed globally and pre-1.0, so the scripts stay plain and `bun dev` works
  without it. `portless clean` removes its CA, state and hosts entries.
- **Cloudflare MCP** (the `cloudflare` plugin) reaches the account behind the CDN: the
  `lenysauzet.com` zone, its cache rule, the `lenysauzet-assets` R2 bucket and its CORS.
  Purge a stale CDN file through it rather than asking.
- **wrangler** writes to that bucket, as `bun run tweet-videos` does:
  `bunx wrangler r2 object put lenysauzet-assets/<key> --file <path> --remote`. An allow
  rule in the user's own settings covers exactly that put; deleting an object, or
  touching another bucket, stays theirs to approve.
- **Playwright MCP** is the browser for verification (the `figure-verify` skill). Claude
  in Chrome only connects to Google Chrome or Edge, not to Dia.

## Verification gate

Before claiming anything is done, run what CI runs and paste the output:

```bash
bun lint && bun run type-check && bun run test && bun run build
```

`.github/workflows/ci.yml` runs exactly these on every PR. A green local run is the
claim; anything less is "untested". Two things CI cannot check:

- **Both themes.** Tokens make light mode free, but free is not verified. Look at both.
- **The build reaches the CDN.** A missing image warns rather than fails the build
  (`measureImage` falls back to 16/9), because an asset can vanish years after its post
  shipped and must not take unrelated deploys down with it. Read the build log.

## Branch workflow

One component per branch, PR into `main`, squash-merge, delete the branch. `main` is
what deploys, so **never commit straight to it**. **Never stack branches**: branch from
an up-to-date `main`, and if a feature needs another branch's code, merge that one
first. Deleting a stacked base branch can close its dependent PRs.

**Design specs and plans are never committed.** `/docs/superpowers/` is gitignored:
working notes go stale and start contradicting what was built. What outlives them goes
in this file, a rule or a skill.

## Writing style

Code, comments and file names in **English**. Comments are for what the code cannot
say: a constraint, a trap, a decision that would otherwise invite a bug-reintroducing
"fix". Never restate the line below. Never use an em dash. No commented-out code.
There is no prettier config and the repo writes single quotes: never run `prettier` on
a directory, and only with `--single-quote` on exact paths.

## Architecture

**Next.js 16 App Router**, statically generated. Server Components by default; add
`'use client'` only for hooks or browser APIs. This Next.js has breaking changes from
what you know: read `node_modules/next/dist/docs/` before using an API.

- **Posts** are `content/*.mdx` with a JS `export const metadata` (title, description,
  tags, date, optional `updated` and `draft`), the slug being the filename. MDX
  components are registered in `mdx-components.tsx`.
- **`content/design-system.mdx`** renders the content components at
  `/posts/design-system`. Read it first when adding or changing one; a new one enters it
  only when the user asks.
- **Media** lives on `cdn.lenysauzet.com`; `lib/cdn.ts` is the only module that knows
  its layout.

### Styling and theming

Tailwind v4 and shadcn/ui, all styling inline through `className` and `cn()`, tokens
only. `--base-hue` is the one knob every colour derives from, text runs on three tiers,
`--primary` is the accent, and `next-themes` puts `light` or `dark` on `<html>`: never
hardcode `dark` anywhere. The traps behind each of those are in
`.claude/rules/styling.md`, which loads with any `.tsx` or `.css` file.

### Layout and conventions

- `app/_components/` is the page shell (DynamicIsland, IndexSection, ReadingRail);
  `components/` is reusable, shadcn primitives in `components/ui/` (added with
  `bunx shadcn@latest add`, configured in `components.json`, several customised: see
  `.claude/rules/ui.md`), custom components as `Name/index.ts` plus `Name.tsx`, or one
  flat file when small.
- **Every component accepts and forwards `className`.** Import order follows
  `.cursor/rules/typescript.mdc`.
- **Imports** use the `@/` alias.
- **Icons** are Hugeicons only, never lucide: data from `@hugeicons/core-free-icons`,
  drawn with `<HugeiconsIcon icon={SomeIcon} />` from `@hugeicons/react`. The exception
  is an icon that draws itself on, which needs `pathLength` per path: `EmailInput` and
  `PasswordInput` hand-author theirs.
- **Animation** is `motion/react`, never `framer-motion`; an exit animation needs
  `AnimatePresence`, and a canvas goes through `components/Shader`.
- **State** stores are Zustand, in `hooks/`.

### Key modules

| Path | What it owns |
|---|---|
| `lib/post-utils.ts` | `getPosts()`: reads and sorts posts, drafts excluded unless asked |
| `lib/post-markdown.ts` | A post as its source, served at `/posts/<slug>/index.md` |
| `lib/cdn.ts` | The CDN layout; a media path resolved by its extension |
| `lib/tweet.ts` | A post on X: its text as links, its videos and their copies on the CDN |
| `lib/image-utils.ts` | Build-time image dimensions; `measureImage` degrades, `getImageDimensions` throws |
| `lib/url-utils.ts` | `isInternalLink()`, `getLinkTypeIcon()` |
| `components/Figure` | The frame every visual shares: block rhythm and caption |
| `components/figures/Diagram` | The toolbox every drawn figure is composed from |
| `components/Chart` | A figure with axes, on Recharts; `series.ts` is its logic |
| `components/Table` | A table as an article reads it |
| `lib/shader.ts`, `components/Shader` | The one WebGL 2 engine, it as a component, and shared GLSL in `glsl.ts` |
| `config/site.ts` | Site metadata, SEO, CDN origin, `getRootMetadata()` |
| `config/code-theme.ts` | The Shiki theme, emitting token variables rather than colours |
| `lib/utils.ts` | `cn()` |

## Testing

Vitest and React Testing Library, colocated as `Name.test.tsx`. jsdom has no layout
and no WebGL, so **logic worth testing lives in pure modules**, and a component test
only proves the component stands. Prove a test by breaking the code it guards.

## The MDX paragraph trap

MDX wraps a component's children in a `<p>` **as soon as they sit on their own line**,
and `p` is mapped to muted prose type, so a reformat alone can render one element in two
colours. Any component that receives MDX children and styles its own text neutralises
the paragraph, as `Anchor` does with `[&>p]:m-0 [&>p]:[font:inherit] [&>p]:text-inherit`,
and `Blockquote`, `Callout` and `Details` with their own `[&>p]:` overrides.

## New component checklist

- [ ] Explicit prop interface, `strict` clean, no `any`, `className` forwarded
- [ ] Keyboard reachable, visible focus ring, labels on icon-only controls, reduced motion
- [ ] Both themes looked at; tokens only
- [ ] No unnecessary `'use client'`
- [ ] Registered in `mdx-components.tsx` if posts use it, and in the design system when asked
- [ ] The rule or skill covering it updated with what it forces
- [ ] Verification gate run, output pasted

## Where the rest lives

**Rules by path.** Claude Code loads these on its own when a matching file is opened;
any other agent reads the one covering the files it touches.

| Working in | Read |
|---|---|
| `content/`, posts, media, `Image`, `Blockquote`, `List`, math, the Markdown twin | `.claude/rules/content.md` |
| Any figure, chart, shader or sandbox, and the code under them | `.claude/rules/figures.md` |
| `components/Table`, `ui/table.tsx` | `.claude/rules/tables.md` |
| Any `.tsx` or `.css`: tokens, text tiers, focus rings, theming | `.claude/rules/styling.md` |
| `components/ui/`, `Slider`, `Toggle`, `Card`, `Details`, form fields | `.claude/rules/ui.md` |
| `app/_components/DynamicIsland`, link previews | `.claude/rules/dynamic-island.md` |
| `app/_components/ReadingRail`, `ScrollFade`, `lib/scroll-column.ts` | `.claude/rules/reading-rail.md` |
| `lib/hues.ts`, the accent presets | `.claude/rules/accent.md` |
| `components/CommandPalette`, `lib/commands`, `lib/search` | `.claude/rules/command-palette.md` |
| `lib/booking.ts`, `lib/supporters.ts`, `SupportCallout` | `.claude/rules/third-parties.md` |
| Any `*.test.*`, `vitest-setup.ts`, `test/` | `.claude/rules/testing.md` |
| `*.ts`, `*.tsx`, `*.css`: TS and React conventions, token tables, test patterns (every agent reads these; Cursor loads them itself) | `.cursor/rules/{typescript,react,tokens,testing}.mdc` |

**Skills by task.** In `.claude/skills/`, read by Claude Code and by Cursor. Load the
skill before the work, a small fix included: a figure's rules are what keep a fix from
breaking it at another value of its control.

| Task | Skill |
|---|---|
| Deciding whether and which figure a post needs | `figures` |
| How any figure looks | `figure-design` |
| Drawn figures, diagrams, systems, 3D as lines, time | `figure-diagram` |
| Charts and data figures | `figure-chart` |
| Shaders, images and video per pixel, `Backdrop` | `figure-shader` |
| Live code in a post | `figure-code` |
| Proving a figure before it ships | `figure-verify` |
| shadcn primitives (vendored, from `skills-lock.json`) | `shadcn` |
| A new post's file | `.cursor/commands/create-article.md` |

A skill's description is what decides when it loads. After changing one, run
`python3 .claude/evals/routing/run.py --repeat 2`: requests that must load a figure skill
and near misses that must not, run against the real repo.
