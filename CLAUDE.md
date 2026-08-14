# CLAUDE.md

Guidance for Claude Code (claude.ai/code) and every other agent working in this repo.
This file is the single source of truth: `AGENTS.md` and `.cursor/rules/general.mdc`
both point here. Glob-scoped detail lives in `.cursor/rules/*.mdc` and is listed under
[Where the rest lives](#where-the-rest-lives).

## Commands

```bash
bun dev              # Development server
bun run build        # Production build
bun start            # Serve the production build
bun lint             # ESLint (eslint-config-next)
bun run type-check   # tsc --noEmit
bun run test         # Vitest, single run
bun run test:watch
```

`bun test` runs Bun's own runner and will **not** work. Always `bun run test`.

## Verification gate

Before claiming anything is done, run what CI runs and paste the output:

```bash
bun lint && bun run type-check && bun run test && bun run build
```

`.github/workflows/ci.yml` runs exactly these on every PR. A green local run is the
claim; anything less is "untested".

Two things CI cannot check, so check them by hand:

- **Both themes.** Every component is styled with tokens, so light mode is free, but
  free is not the same as verified. Look at it in both.
- **The build reaches the CDN.** `components/Image` resolves image dimensions from
  remote headers at build time, so a broken asset path fails the build by design.

## Branch workflow

One component per branch, PR into `main`, squash-merge, delete the branch. `main` is
what deploys, so **never commit straight to it**.

**Never stack branches:**

1. Branch from an up-to-date `main` (`git checkout main && git pull` first).
2. If a feature needs another branch's code, **merge that one into `main` first**. A
   cross-branch dependency is the signal to merge, not to stack.
3. Shared foundations (Vitest setup, design tokens, `Image`, `List`) are already on
   `main`, so independent components can be built in parallel and merged in any order.

Squash-merging a stack after the fact is painful: deleting a base branch can *close*
its dependent PRs.

## Writing style

Code, comments, and file names in **English**. Comments are for what the code cannot
say: a constraint, a trap, a decision that would otherwise invite a bug-reintroducing
"fix". Never restate the line below. Never use an em dash. No commented-out code, that
is what git history is for.

## Architecture

**Next.js 16 App Router**, statically generated. Server Components by default; add
`'use client'` only for hooks or browser APIs.

`content/design-system.mdx` renders every content component live at
`/posts/design-system`. Read it first when adding or changing one.

### Content system

Posts live in `content/*.mdx` and use **JS export frontmatter**, not YAML:

```mdx
export const metadata = {
  title: '...',
  description: '...',
  tags: ['webgl'],
  date: 'YYYY-MM-DD',
  draft: true, // optional: reachable by URL, hidden from every listing
};
```

The slug is the filename. Posts load via dynamic `import()` at build time
(`generateStaticParams` + `dynamicParams = false` in `app/posts/[slug]/page.tsx`).
`getPosts()` in `lib/post-utils.ts` reads `content/` and imports each file's metadata;
it excludes drafts unless asked, so the feed, RSS and sitemap never leak them.

MDX components are registered globally in `mdx-components.tsx`.

### Media and the CDN

Media lives on `cdn.lenysauzet.com` (Cloudflare R2), namespaced by kind: `images/…`
and `videos/…`. Origin and layout are declared in `config/site.ts` (`cdnUrl`,
`cdnPaths`); `lib/cdn.ts` is the only module aware of them. Absolute URLs pass through
untouched, so a post can point at a third-party asset.

```mdx
<Image src="blog/halftone.png" alt="Diagram breaking down the distance field" />
```

**Prefer omitting `width`/`height`.** `components/Image` is an async Server Component
that reads the image header at build time (ranged request + `image-size`, memoized with
`cache()`) to reserve space and avoid CLS. Hand-written values tend to be the *displayed*
size, not the intrinsic one, which skews the aspect ratio and the generated `srcset`.
Supplying both skips the lookup.

Markdown `![alt](src)` maps onto the same component. `remark-unwrap-images` lifts it out
of the paragraph remark would wrap it in, since `<figure>` inside `<p>` is invalid. It is
pinned to `4.0.1`: **5.0.0 is a broken publish whose npm tarball contains no code.**

Cloudflare image transformations are not enabled on the zone, so optimization runs
through Next's own optimizer via `images.remotePatterns`. Do not pass a `loader` to
`next/image`: that makes Next bypass its optimizer and serve the loader's URL verbatim.

### Styling and tokens

**Tailwind v4 + Shadcn/UI.** No style files, all styling is inline `className`. Use
`cn()` from `@/lib/utils` for conditional merging. Token tables live in
`.cursor/rules/tokens.mdc`; the definitions live in `app/globals.css`. Three rules
that neither file makes obvious:

- **`--base-hue: 262.04` is the only knob.** Every oklch token derives from it, syntax
  highlighting included. Retheming the site is one line, so never hardcode a colour that
  should follow it.
- **Text runs on three tiers**: `--foreground` (headings, `strong`), `--muted-foreground`
  (body copy, `h4`), `--subtle-foreground` (article date, discreet links, card titles,
  `em`). The third is ours, not shadcn's — added per its "Adding Custom Colors" recipe, as
  `--success` and `--warning` were. **Do not substitute an opacity step for it**: an alpha
  composites against whatever surface sits behind the text, so the same tier would drift
  between the page and a card, and it can neither darken past `--muted-foreground` in
  light mode nor change chroma.
- **`--primary` is the thematic accent** shared by every active state (primary buttons,
  checked boxes, list markers, callout accents) and by hyperlinks, which `Anchor` takes
  straight from it. Not `--accent`, which is shadcn's muted hover *surface*.
- **Inline code is not syntax-highlighted.** It takes a flat `--code-inline`, because a
  bare identifier tokenises as plain text in any grammar and highlighting only dimmed it
  into the prose. Set in `next.config.ts` via `defaultLang`.

### Theming

`next-themes` writes `light`/`dark` as a class on `<html>` (`attribute="class"`,
`defaultTheme="dark"`, `enableSystem`). **Never hardcode `dark` on `<body>` or any
element** — that force-applies dark and breaks the toggle. It was a bug once; don't
reintroduce it. `:root` is light, `.dark` overrides, both in `app/globals.css`.

`components/ModeToggle` is the switcher, mounted in the Dock. `<html
suppressHydrationWarning>` plus next-themes' injected script avoids the flash. Mobile
chrome colour follows the OS via the `themeColor` viewport export, not the toggle.

### Component layout

- `app/_components/` — page-shell only (Header, Dock, IndexSection). Not reused outside it.
- `components/` — reusable. Shadcn primitives in `components/ui/` (CLI-generated, avoid
  manual edits). Custom components as `ComponentName/index.ts` + `ComponentName.tsx`,
  or a single flat file.
- Add primitives with `bunx shadcn@latest add <component>`; config in `components.json`.

### Key modules

| Path | What it owns |
|---|---|
| `lib/post-utils.ts` | `getPosts()`: reads and sorts all MDX posts |
| `lib/cdn.ts` | The only module that knows the CDN layout |
| `lib/image-utils.ts` | Build-time intrinsic dimensions; throws rather than guessing |
| `lib/url-utils.ts` | `isInternalLink()`, `getLinkTypeIcon()` |
| `lib/utils.ts` | `cn()` |
| `config/site.ts` | All site metadata, SEO, `getRootMetadata()` |
| `config/code-theme.ts` | Shiki theme, inlined as serializable data |

### Conventions

- **Path alias**: `@/` resolves to the project root. Use it for all non-relative imports.
- **Icons**: `@hugeicons/react` exclusively. Icon data comes from
  `@hugeicons/core-free-icons`; render it with `<HugeiconsIcon icon={SomeIcon} />`.
  Not lucide, not heroicons. The one exception is a **line-drawing animation**: it
  needs `pathLength` and a dash offset on each individual path, which the Hugeicons
  renderer does not expose, so `EmailInput` and `PasswordInput` hand-author theirs.
- **Animation**: always `from 'motion/react'`, never `from 'framer-motion'`. Same
  package, but `motion/react` is the canonical alias. `AnimatePresence` is required for
  exit animations. OGL canvases must be `'use client'` and initialize in `useEffect`
  with cleanup.
- **State**: Zustand stores live in `hooks/` (`use-cmdk-store.ts`,
  `use-splashScreen-store.tsx`).

## Testing

Vitest + React Testing Library, colocated as `Component.test.tsx`. Two constraints
shape almost every test here:

- **jsdom gives every element a zero-sized box**, so Motion's layout projection never
  settles and a subtree animating out via a shared `layoutId` never unmounts. Assert
  dismissal on the component that owns the dialog, not the one that owns the morph.
  Animation fidelity belongs in a real browser.
- **`server-only` is aliased to a stub** (`test/stubs/`) because Vitest does not set the
  react-server condition. The guard still holds in the real build.

`vitest-setup.ts` polyfills `PointerEvent` and forces `prefers-reduced-motion` for
determinism.

**jsdom is pinned to v26** and must stay there while the Node floor is 22.9: v29+ needs
`require(ESM)`, which lands in 22.12. jsdom 30 fails every test file with
`ERR_REQUIRE_ESM`. To lift the pin, raise `engines.node` and `.nvmrc` first.

That pin is also why **CI pins Node via `.nvmrc`**. Vitest spawns Node, not bun, so an
unpinned runner tests against a different runtime than anyone develops on: a jsdom 30
bump went green in CI while failing locally. If you change `.nvmrc`, the workflow follows
it automatically, but re-run the suite locally.

## The MDX paragraph trap

MDX wraps a component's children in a `<p>` **as soon as they sit on their own line**:

```mdx
<Anchor href="/">Back</Anchor>          → <a>Back</a>
<Anchor href="/">
  Back                                   → <a><p>Back</p></a>
</Anchor>
```

`p` is globally mapped to muted prose type in `mdx-components.tsx`, so that paragraph
drags `text-muted-foreground`, `font-display` and `leading-7` into whatever contains it.
In an inline component the result is one element rendered in two colours: the label takes
the paragraph's, any icon sibling keeps the component's.

**A reformat is enough to trigger it**, which is what makes it nasty: wrapping a long line
silently changes the rendering. Any component that can receive MDX children and styles its
own text must neutralise the paragraph, as `Anchor` does with
`[&>p]:m-0 [&>p]:[font:inherit] [&>p]:text-inherit`, or as `Blockquote`, `Callout` and
`Details` do with their own `[&>p]:` / `[&>*]:` overrides.

## Known intentional patterns

Each of these looks like a mistake and is not. Read before "fixing" one.

**Two Separator components.** `components/Separator.tsx` is a custom dashed decorative
rule (between post sections); `components/ui/separator.tsx` is the Radix primitive (nav,
layout). Do not consolidate.

**Two text-reveal components.** Prefer `components/ScrambledText.tsx`, the
accessibility-first version with `useReducedMotion()` and an sr-only fallback.
`TextScramble.tsx` is kept for reference only.

**`components/Image/Lightbox.tsx` uses no dialog primitive** — not `ui/dialog.tsx`, not
Radix, not Base UI. Radix ties its scroll lock to the layer's mount, and the layer must
outlive a dismiss to animate out, so the page is frozen for the whole exit animation by
construction. The surface holds one decorative image, so a focus trap has nothing to
trap. What remains is a portal, Escape, focus restoration and two ARIA attributes.
Colocated on purpose; do not promote it until a second consumer exists.

**`@base-ui/react` is a real dependency, used by exactly one component**:
`components/ui/combobox.tsx`, since Radix ships no combobox. Radix is the primitive layer
for everything else. Do not add Base UI components without a reason that specific.

**`components/Blockquote` is a centred pull-quote**, not a left-border aside; markdown
`>` maps to it. It uses `font-serif` (Instrument Serif) as **a deliberate departure from
the reference**, which renders its pull-quote in the default sans because its own
`var(--font-serif)` is undefined. This is the one place the blog knowingly diverges, so
don't "correct" it back to match. The inner `<p>` is the globally MDX-mapped paragraph,
hence the `[&>p]:` overrides.

**Math (`$…$`, `$$…$$`) renders at build time** via `remark-math` + `rehype-mathjax`
(SVG output): vector glyphs, so zero client JS, no CLS, no web-font loading. MathJax over
KaTeX because it handles a deeply-nested radical (a `bmatrix` of `\sqrt{\dfrac…}`)
without the superscript collision KaTeX produces. **It must run before
`rehype-pretty-code`**, which would otherwise try to highlight the `language-math` nodes.
Two `globals.css` rules fight Tailwind preflight's `svg { display: block }`, which
otherwise decentres display math and breaks inline math onto its own line. Array cells are
textstyle by LaTeX rule, so use `\dfrac` for displaystyle fractions.

**`components/ui/badge.tsx` is customized beyond the CLI output** — the "Pill" family.
Sized for prose (`text-sm px-3 py-1 rounded-lg`) and carrying four tinted status variants
(`info` / `success` / `warning` / `danger`), each a ~10% wash of its colour. shadcn's stock
`destructive` is kept alongside `danger`. Because the file is CLI-generated, update it
with `bunx shadcn@latest add badge --diff` and re-apply the edits; do not overwrite.

**Prose lists (`components/List`).** Every item renders the same decorative arrow marker;
ordered lists hide it via CSS and show a counter instead. Those counter rules live in
`app/globals.css` under `ol[data-list='ordered']` — a deliberate exception to the
inline-className rule, because `content: counter(...)` cannot be a Tailwind class. Nesting
needs no depth logic: each nested list carries its own `data-list`.

**`components/ui/card.tsx` is intentionally customized** beyond the CLI output, like
`badge.tsx`. Three edits: the edge is a `border` resolving from `--border` rather than
`ring-1 ring-foreground/10`, so it matches every other inset surface; `size` defaults to
`sm`, since 16px is this site's rhythm; and `CardTitle` / `CardContent` carry the prose
type posts use. Because the file is CLI-generated, update it with
`bunx shadcn@latest add card --diff` and re-apply these edits — don't overwrite.

**`components/Card` holds no style at all.** The primitive owns structure and appearance;
the wrapper only adds the article's block rhythm (`my-6`) and the header a `title`
implies. The separator is `border-b` on `CardHeader`: the primitive's `[.border-b]:pb-*`
supplies the padding and preflight's `* { @apply border-border }` supplies the colour, so
neither is named. The title sits on `text-subtle-foreground`, the third text tier, which
keeps it a shade under the body rather than level with it.
`CardFooter` and `CardAction` are deliberately not re-exported; import them from
`@/components/ui/card` if a post ever needs them.

**`components/Details` is built on the shadcn Accordion primitive**, not a hand-rolled
disclosure, so Radix owns the open state and the ARIA wiring. It composes
`AccordionPrimitive.Header/Trigger` and `.Content` directly, because the generated
wrappers bring a chevron we don't want and an inner `h-(--radix-…-height)` div that
clipped the bottom padding. All open-state styling reads Radix's `data-state` through a
`group`, so there is no client state of our own. Three traps live here:

- The `details-open` / `details-close` `@keyframes` **must have unique names**. Reusing
  `accordion-down/up` silently fails: the bundler dedupes same-named keyframes and keeps
  `tw-animate-css`'s height-only copy.
- Put the animation on the `className`, not a separate `[data-state]` CSS rule. A
  separate rule races Radix's unmount check and the exit never plays.
- Write `filter: none`, not `filter: blur(0)`. Lightning CSS minifies the latter to the
  invalid `blur()`.

**Form fields are one surface, not a container plus parts.** `components/ui/input.tsx`
exports `inputSurface`, the whole visual contract (edge, fill, radius, type, and every
state), and `Textarea` reuses it so the two can never drift. Consequences that look
wrong until you know why:

- **`components/ui/input-group.tsx` is a positioning shell**, heavily cut down from the
  CLI output: no border, no background, no flex row. The addon floats over the control
  with `position: absolute`. Laid out as a flex sibling instead, the addon takes a box
  of its own and the focus glow visibly breaks across that seam. The addon **must follow
  the control in the DOM**, because every state colour on it reads the control through
  `peer-*`, which only sees earlier siblings. Do not restore `add --diff` output here,
  and do not reach for it to build a plain icon-and-input row: `CommandInput` lays its
  search box out inline for exactly that reason. It carries no `"use client"`, which is
  what keeps `EmailInput` off the client bundle entirely.
- **Hover applies the full focus treatment** (primary edge, glow, icon colour) and focus
  simply makes it persist. That is deliberate: the field advertises what focusing it will
  do. Guard it with `enabled:` so a disabled field stays inert. It lives **twice**: on the
  control for a bare field, and on the group, because an addon overlays the control and
  pointing at it would otherwise leave the field flat under the cursor.
- **Disabled names its colours; it never fades the element.** The reference reaches its
  flat slab with `opacity`, and that is a trap: opacity drags the text down with the
  fill, so contrast cannot be raised at all. Stacked under our already-translucent
  placeholder it bottomed out at **1.43:1**. Naming `disabled:bg-input-disabled`,
  `disabled:border-input-disabled` (the edge has to match the fill or the slab keeps a
  rim) and `disabled:text-subtle-foreground` paints the identical surface and reaches
  6.1:1. `--input-disabled` carries the reference's *already composited* value in dark,
  and exists at all because no other token works in both themes: `--muted` is too pale
  to darken a dark field, `--border` too dark to lighten a light one.
- **The idle icon is `--input-icon`, not a text tier.** It is an affordance, so it sits
  a quarter of the way from `--border` toward `--subtle-foreground` and stays clearly
  under the placeholder beside it. Putting it on `--subtle-foreground` makes it read as
  copy and it visibly outshines the field. Its paths also carry `strokeWidth={2}`, not
  the 1.6 the SVG root inherits, or the glyph renders a third thinner than it should.

**`EmailInput` validates without JavaScript.** `:valid:not(:placeholder-shown)` on a
`type="email"` control is the browser's own parse, so the component stays a Server
Component. **The placeholder is load-bearing** — it is what separates empty from filled,
since an empty non-required email input is already `:valid`. `type="email"` on its own
accepts `hello@a` and `hello@gmail.c`, both legal per spec, so a `pattern` narrows it to
a dotted host with a two-letter TLD; `pattern` feeds `:valid` too, so this stays scriptless.
The `@` and the tick are two paths in one SVG, each carrying its own colour, so the valid
green never has to win a specificity fight against the hover blue.

**Drawn icons need `stroke-dasharray` longer than the path.** Every animated glyph sets
`pathLength={1}` and then dashes at `2`, hiding at offset `2` rather than `1`. At
`dasharray: 1` the gap starts exactly on the path's first point, and a round `linecap`
paints that zero-length dash as a **visible dot** in the middle of the glyph. Overshooting
the array puts the whole path inside one gap, so nothing is painted at all.

**Toggle controls share one surface and draw their own marks.** Checkbox, Switch and
RadioGroup all pull `controlSurface` from `components/ui/control-surface.ts` — the whole
state machine, so it cannot drift three ways — and add only their shape and mark.

- **The mark is a pseudo-element on the root, never a Radix `Indicator`.** Radix unmounts
  the indicator the moment a control unchecks, which cuts the exit animation off at the
  first frame. `before:` carries the mark, `after:` stays the touch-target expander.
- **Each mark transitions the property it actually changes**: `stroke-dashoffset` for the
  checkbox tick, `scale` for the radio dot, `translate` for the switch thumb. Tailwind v4
  sets `rotate`, `scale` and `translate` as their own properties rather than folding them
  into `transform`, so a transition naming `transform` compiles cleanly and animates
  **nothing**. This has now bitten three times here (Button's press, Sandpack's buttons,
  all three controls); `control-surface.test.tsx` guards it, matching the mark's whole
  transition declaration because the shared surface animates `scale` too.
- **The tick draws itself on**, the same `stroke-dashoffset` technique `EmailInput` uses,
  dashed past the path length so the hidden state falls inside a gap. It is knocked out
  in `--background`, except when disabled: the disabled fill sits so near the page that a
  background-coloured mark disappears into it, so it takes `--subtle-foreground` there.
- **Every control answers the pointer before it answers the click**: `scale-105` on
  hover, `0.97` held down, guarded by `enabled:` and dropped under `motion-reduce`.
- **The switch knob widens rather than scales.** Held down it goes 18px to 20px at a
  fixed radius, drawing itself into a capsule; `scale-x` would stretch the radius with
  it and give an ellipse. Those 2px are exactly what the travel leaves free at the far
  end — widen further and a white knob pokes out past the pill's own edge.
- **The knob wears `--shadow-knob`, not `--shadow-bevel`.** Same lighting, but the
  button's 2px blur smears across a quarter of an 18px circle and turns the edge into a
  gradient. Held to 0.5px it stays an edge.
- `--shadow-control` is the bloom, wider than `--shadow-field`, because a 24px control
  needs the glow to clear its own edge before it reads.

**The slider is a bar, not a rail with a knob.** A 48px rounded surface whose filled
part is the *same* wash laid over itself, so the boundary reads as depth rather than as
a second colour; a 2px grip sits just inside its leading edge and the thumb is a bare
20×44 drag target with nothing drawn on it. Two things this shape forces:

- **`aria-label` belongs on the thumb.** Radix puts `role="slider"` there, so a label
  left on the root is never announced. `components/ui/slider.tsx` forwards it.
- **The label and readout sit over the bar, not inside the control**, so
  `data-disabled:opacity-40` fades the surface without taking the caption with it.
  `components/Slider` describes that readout with `unit` and `decimals` rather than a
  formatter callback: a post is a Server Component, and React cannot pass a function
  across that boundary — the callback version crashed the page.

## New component checklist

- [ ] **TypeScript**: explicit prop interface, `strict` clean, no `any`
- [ ] **Accessibility**: keyboard navigable, visible focus ring, `aria-label` on icon-only
      elements, `useReducedMotion()` for animations
- [ ] **Both themes** verified visually
- [ ] **Server/client** correctly classified: no unnecessary `'use client'`
- [ ] **Tokens only**: no hardcoded colour, spacing or font value
- [ ] **Import order** per `.cursor/rules/typescript.mdc`
- [ ] **MDX registration** in `mdx-components.tsx` if usable in posts, plus a section in
      `content/design-system.mdx`
- [ ] **Verification gate** run, output pasted

## Where the rest lives

| File | Scope | Covers |
|---|---|---|
| `.cursor/rules/typescript.mdc` | `*.ts`, `*.tsx` | TS conventions, **import order**, ESLint |
| `.cursor/rules/tokens.mdc` | `*.ts`, `*.tsx`, `*.css` | Full design-token tables, Tailwind v4 |
| `.cursor/rules/react.mdc` | `*.ts`, `*.tsx` | Component conventions, MDX widgets, animation |
| `.cursor/rules/testing.mdc` | `*.test.*` | Testing patterns |
| `.cursor/commands/create-article.md` | — | `/create-article` scaffold |
