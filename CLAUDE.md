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
  remote headers at build time. A path that no longer answers no longer fails the
  build: `measureImage` warns, names the file, and falls back to 16/9, because an
  asset can vanish years after a post shipped and taking every later deploy down
  with it punishes work unrelated to the breakage. Read the build log.

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

**Design specs and implementation plans are never committed.** `/docs/superpowers/` is
gitignored: they are working notes for building the thing, not part of it, and one that
ships alongside goes stale and starts contradicting what was actually built. Write them
there, leave them on disk, and keep what outlives them in this file.

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
  updated: 'YYYY-MM-DD', // optional: shows a badge in the post header
  draft: true, // optional: reachable by URL, hidden from every listing
};
```

The slug is the filename. Posts load via dynamic `import()` at build time
(`generateStaticParams` + `dynamicParams = false` in `app/posts/[slug]/page.tsx`).
`getPosts()` in `lib/post-utils.ts` reads `content/` and imports each file's metadata;
it excludes drafts unless asked, so the feed, RSS and sitemap never leak them.

`updated` is set by hand, so it means "changed in a way worth telling a reader
about" rather than "touched". It feeds the header badge and OpenGraph's
`modifiedTime`. **The badge's wording is read on the client**, through
`useSyncExternalStore` with the build's value as the server snapshot: a post is
static, so a relative label rendered at build time would still claim the post changed
three days ago a year later.

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
- **Never put `outline-none` on the element that draws its own focus ring.** Tailwind v4
  renamed v3's `outline-none` to `outline-hidden` and gave the old name new behaviour:
  it now sets `outline-style: none` for that element, and the width utilities resolve
  their style from the same variable. `outline-none focus-visible:outline-2` therefore
  computes to `2px none` and paints nothing. Drop it: the browser only draws its default
  ring when `:focus-visible` matches anyway, which is where ours takes over. **It only
  bites an actual `outline`** — `ring-*` is a box-shadow and is untouched by it, which is
  why `MediaPlayer`, `ImageZoom`, `BeforeAfterSlider` and the Sandpack buttons are fine
  as written. Also harmless when the ring lives on a different element (`ui/slider.tsx`
  puts it on the root, `outline-none` on the thumb) or when focus is shown some other way
  (`ui/input.tsx` uses border and shadow, `CopyButton` a background). Grep for it with
  care: `focus-visible:outline-` matches `focus-visible:outline-none` itself.
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
| `lib/image-utils.ts` | Build-time intrinsic dimensions; `measureImage` degrades, `getImageDimensions` throws |
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
- **State**: Zustand stores live in `hooks/` (`use-cmdk-store.ts`).

## Testing

Vitest + React Testing Library, colocated as `Component.test.tsx`. Two constraints
shape almost every test here:

- **jsdom gives every element a zero-sized box**, so Motion's layout projection never
  settles and a subtree animating out via a shared `layoutId` never unmounts. Assert
  dismissal on the component that owns the dialog, not the one that owns the morph.
  Animation fidelity belongs in a real browser.
- **`server-only` is aliased to a stub** (`test/stubs/`) because Vitest does not set the
  react-server condition. The guard still holds in the real build.
- **Collapse Motion's transitions where a test waits for an unmount.** `vitest-setup`
  forces reduced motion, but Motion caches that at module scope, so whether it takes
  effect depends on import order: the Lightbox exit measured either 20ms or a full
  300ms tween across runs, and on a loaded runner the tween outlived `waitFor`'s one
  second default about one run in three. Wrapping the harness in
  `<MotionConfig transition={{ duration: 0 }}>` settles it at 19-25ms. Raising the
  timeout only widens the window the race runs in.

`vitest-setup.ts` polyfills `PointerEvent` and forces `prefers-reduced-motion` for
determinism.

**jsdom tracks the Node floor**, which `.nvmrc` and `engines.node` set to 24. jsdom 30
declares `^22.22.2 || ^24.15.0 || >=26.0.0`, so dropping below any of those brings back
the `ERR_REQUIRE_ESM` that every test file threw under the old 22.9 floor.

That coupling is why **CI pins Node via `.nvmrc`**. Vitest spawns Node, not bun, so an
unpinned runner tests against a different runtime than anyone develops on: a jsdom bump
once went green in CI while failing locally. If you change `.nvmrc`, the workflow follows
it automatically, but run `nvm install` and re-run the suite before trusting it.

**`@types/node` tracks the runtime, never the registry.** It stays on the major
`.nvmrc` names, currently 24. Types describing APIs the runtime has not got will
happily typecheck code that crashes, so a bump here waits for the floor to move first.

**Do not assert on serialised CSS.** A parser may rewrite what it stores: jsdom 30 drops
`to bottom` from a gradient, being the default direction, so a test looking for it broke
on a component that had not changed. Assert the non-default direction, or its absence.

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

**The command palette is a registry, not a component full of items.**
`lib/commands/registry.ts` is a list of `{ id, label, icon, group, keywords, run }`,
and `components/CommandPalette` only renders it and hands each `run` the page's router
and theme. Adding a command is one entry; nothing about the surface changes. `run`
takes a context rather than reaching for hooks itself, which is what keeps the registry
a plain module a test can read.

A command either acts on the site or **opens a page of the palette**, never both, and
the `Command` union is what keeps the pair from being written together. `search` is the
only page so far: the same dialog and the same input, with its own list underneath.
Four things that page forces, none of them obvious:

- **It ranks its own rows**, so cmdk is handed `shouldFilter={false}` and the selection
  has to be driven from outside. cmdk moves it when *its* search box changes and at no
  other time, so arriving on the page, the index landing, and coming back to the root
  all leave the list unselected and Enter answering nothing. `onResults` is what names
  the row to land on: kept where it is while it still stands, dropped to the top once
  it does not.
- **Backspace-to-leave is read on the cmdk root, not on the input.** A row reached with
  the mouse keeps the focus it was given, and the key never reaches the box. For the
  same reason the input is focused by hand when a page opens, or typing goes nowhere.
- **cmdk overrides `onPointerMove` with `undefined` on a disabled row**, which is why
  the palette catches a disabled hover on `onPointerEnter` instead. It also refuses to
  move its selection onto such a row, which is what left the previous one lit.
- **A list swapped wholesale needs a new `key`.** `FadingList` finds the scrolling node
  once, at mount, and a page change otherwise leaves its observers on a detached one.

The index behind it is built at build time: `lib/search/build-index.ts` walks `getPosts`
(drafts excluded, so nothing hidden is findable through the back door), reduces each
post with `toPlainText`, and `app/search-index.json/route.ts` serves the serialized
result as a static file, fetched once on the first search. **`INDEX_OPTIONS` is shared
by the build and the browser on purpose**: `loadJSON` reads a serialized index against
whatever options it is handed rather than the ones it was built with, so the two
drifting apart does not fail, it just stops matching. Only what a result row draws is
stored, and `text` is stored as well as indexed because a result quotes the line it
matched, which is the whole of what the payload buys over a title-only index.

`components/ui/command.tsx` is customized beyond the CLI output twice over: its
`CommandInput` is laid out inline rather than through `InputGroup`, and a selected item
carries `--primary` rather than `--foreground`. Update it with
`bunx shadcn@latest add command --diff` and re-apply, and note that overriding the
selected colour from a caller's `className` does not work: `cn()` drops it as a
conflict with the primitive's own, silently.

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
- **It spends that width inward, never always-rightward.** Growing in one direction eats
  the gap the knob keeps from whichever wall it has travelled to, so the checked state
  pulls its travel back by the 2px it gains and grows leftward instead. That pull needs
  its own fast timing: left on the checked transition it would creep over `.35s` with an
  overshoot while the width snapped in `.12s`, and the two would visibly disagree.
- **The knob wears `--shadow-knob`, not `--shadow-bevel`.** Same lighting, but the
  button's 2px blur smears across a quarter of an 18px circle and turns the edge into a
  gradient. Held to 0.5px it stays an edge.
- `--shadow-control` is the bloom, wider than `--shadow-field`, because a 24px control
  needs the glow to clear its own edge before it reads.

**The slider is a bar, not a rail with a knob.** A 48px rounded surface whose filled
part is the *same* `--wash` laid over itself, so the boundary reads as depth rather than
as a second colour; a 2px grip sits just inside its leading edge and the thumb is a bare
20×44 drag target with nothing drawn on it. What that shape forces:

- **`aria-label` belongs on the thumb.** Radix puts `role="slider"` there, so a label
  left on the root is never announced. `components/ui/slider.tsx` forwards it.
- **The label and readout sit over the bar, not inside the control**, so
  `data-disabled:opacity-40` fades the surface without taking the caption with it.
  `components/Slider` describes that readout with `unit` and `decimals` rather than a
  formatter callback: a post is a Server Component, and React cannot pass a function
  across that boundary — the callback version crashed the page.
- **The fill is ours, not `SliderPrimitive.Range`.** Radix drives Range's width from the
  value directly, which cannot be sprung; a `motion.div` on a spring can, so a click
  anywhere on the bar travels rather than jumps. Radix still owns the pointer, keyboard
  and ARIA — only the painting moved. `ui/slider.tsx` falls back to `Range` when given
  no child, so a bare `<Slider>` still renders.
- **The grip fades on collision, not on a percentage.** It hides where it would run into
  the label or the readout, so it stays visible *past* either of them: before the label
  at the bottom of the range, past the readout at the top. The threshold depends on how
  wide the caption happens to be, so it is measured through a `ResizeObserver`. A
  between-the-two test looks equivalent and is not — it blanks both extremes.
- **The grip is its own element, not the fill's `::after`.** At the bottom of the range
  the fill has no width to hang it off, and it has to stay pinned inside the bar rather
  than follow the fill's edge out of the track.
- **Springs must be under-damped to read as springs.** Damping ratio is
  `damping / (2 * sqrt(stiffness * mass))`; at or above 1 there is no overshoot at all
  and the motion is merely smooth. Stiffness is what makes an arrival abrupt, damping is
  what decides how far it rings past — reach for damping when something is too springy,
  or the arrival goes soft along with the rebound.
- **One spring runs for the life of the component and the fill chases it.** Nothing is
  triggered, staged or branched: setting the value only moves the mark, and a chase lags
  while its mark is moving then catches up once it stops. That single behaviour *is* the
  softness under a drag and the settle at the end of one. Several rounds were lost
  reaching for something more elaborate — a timed curve, keyframes, a release flourish,
  a spring picked per distance — and every one of them was rejected on feel. A timed
  curve restarted on each pointer move begins again from rest and reads as easing off
  then lurching; a flourish fired on release lands after the hand has already stopped,
  which is a beat too late.
- **Its constants were derived from the reference, not guessed.** Measured there: 6.35
  points of lag behind a pointer moving at 125 points a second, converging to 0.001 the
  moment it holds still, and clicks overshooting 1.2% of whatever they cover. Lag is
  `2 * ratio * speed / frequency` and overshoot is `exp(-pi * ratio / sqrt(1 - ratio^2))`,
  which solves to a ratio of 0.81 and a frequency of 25 rad/s. Ours then measures 6.21,
  0.001, and 0.12 / 1.02 against its 0.12 / 1.00.
- **Sample an animation from inside the page**, through `requestAnimationFrame`, not by
  polling over the Playwright wire. Each round trip costs 15-20ms, which is enough to
  step over a peak: the same 93-point move read 0.50 polled and 0.90 sampled in-page.
- **Never `Math.abs` a spring you want to see settle.** A spring settles by crossing
  zero, so an absolute value turns the rebound back into a second push: the bar bumps
  outward twice instead of recoiling. The give is signed against the side that was
  pulled, and that side is *latched*, because reading it live flips the anchor mid-bounce.
- **Anything a transform reads has to be a motion value, not a ref.** Widths land after
  mount via `ResizeObserver`, and `useTransform` only recomputes when one of its inputs
  changes — a transform reading `ref.current` keeps whatever it resolved to at mount,
  which is how the grip ended up parked at the far left.
- **Dragging past an end gives.** The overshoot has to be read from the pointer, because
  Radix has already clamped the value. The frame's rect is captured once at pointer
  down: it is being scaled by what we are about to set, so re-reading it would feed back
  into itself.
- **A step resists before it gives way.** The fill is dragged off its detent by a `tanh`
  pull, so it strains ahead of the value and springs across when Radix finally flips.
  `tanh` leaves the detent at slope 1 and only firms up near the limit — the bar tracks
  the pointer exactly for the first pixels, which is what makes the resistance read as
  resistance rather than as lag. A ratio curve damps from the very first pixel and never
  tracks at all. The pull is a fraction of the step itself rather than a prop of its own,
  which is why a fine step resists imperceptibly and a coarse one reads as a detent. Keep
  that fraction under a half: at a half the fill reaches the midpoint the step snaps on,
  and the snap starts reading as a correction rather than a release.
- **The strain is recomputed, never remembered.** It is a function of where the pointer
  is *and* which step the value has landed on, and Radix moves the value on its own
  mid-drag. Storing it leaves the bar holding a figure measured against the previous
  step: held near the top it read 102% of itself, saved only by a clamp. The live drag
  is kept instead, and the target is assembled from it in one place.
- **Dots mark the detents, up to a point.** Past twenty steps they stop being countable
  and read as texture, so the bar draws none — a continuous slider is stepped by 1 and
  would otherwise draw one per unit. They are filtered against the caption at measure
  time, like the grip, and the one the bar is resting on fades out, since the grip
  already marks that spot. Match it with a tolerance rather than an equality: both sides
  are a division reduced to a percentage, and thirds do not land on the same last digit.

**Select is a raised surface, not an inset field.** Where `Input` is cut into the page,
the trigger sits *on* it — on `--wash/30`, the slider's own wash — and answers a hover by
lifting to `/40` rather than taking an edge. The panel wears the same wash over
`backdrop-blur-md backdrop-saturate-[115%]`, so what it covers stays readable through it,
and its items are inset by `mx-1` so a highlight reads as a card lifting out of the list
rather than a band across it.

**Buy Me a Coffee answers 200 to everything.** `lib/supporters.ts` and
`app/api/supporters/route.ts` read their API, and `response.ok` proves nothing there: an
empty result is `{ error: "No supporters" }` and a stale token is a 200 carrying their
*login page*, so the route checks the content type instead. Their published reference is
marked no longer maintained and is wrong in ways that matter — it omits `support_hidden`,
which the live payload does send and which reads as a privacy flag, and it shows
`supporter_name` null with the real name in `payer_name`. An amount is
`support_coffees × support_coffee_price`; reading either alone turns a 5 EUR coffee into
"1". `per_page` is fixed at 5 and ignored when passed, so more names means walking pages.
**Never widen what the band shows on the strength of that reference alone** — verify
against a live response first, and when a privacy field is ambiguous, exclude.

**`components/SupportCallout` fetches from the browser on purpose.** Posts are statically
generated, so reading the supporter list at build time would freeze the names until the
next deploy. The card itself stays a Server Component; only the band is a client.

**The band's repeat count is a ratio of names, never a measurement.** A window
`ROWS_IN_VIEW` rows tall over a repeat of `count` rows is `ceil(ROWS_IN_VIEW / count)` —
row height sits on both sides and cancels. Dividing the rendered list's height by the
repeat count already drawn feeds an answer into its own input; that version asked for 317
repeats where 18 was right and rendered 11,160 rows. Under `prefers-reduced-motion` the
whole apparatus goes, not just the movement, because a frozen window of repeated names
reads as a duplication bug. **jsdom cannot reach any of this**: `vitest-setup` forces
reduced motion and Motion caches it at module scope, so the loop and the ramps are
verified in a browser and only the arithmetic is a unit test.

**`components/Backdrop` draws onto transparency, and the page supplies the ground.**
The shader outputs the accent with the ink as alpha, so `--background` is never copied
into the frame. It used to be a uniform, and a theme flip left the old one baked in
until the next mount: light mode with a black blob over it. Do not reintroduce it. The
framing gradients stay in CSS for the same reason, and cost nothing extra: measured
under 6x CPU throttling, opaque and transparent both delivered 961 frames over 8s.

**The accent is read on every frame, because CSS has no change event.** Three things
change what a token resolves to and only two of them are DOM mutations: a theme class,
an inline override, and an edit to a rule in the stylesheet. That third one is what
devtools does and what a runtime `--base-hue` control would do, and no observer can
see it. Watching `<html>` and `document.head` looked right and left the visual on the
old hue while the rest of the site rethemed. Reading it from a React effect is worse
still: child effects run before the theme provider's, which is what writes the class,
so the read lands one theme behind.

The read is affordable because the oklch-to-sRGB conversion is skipped unless the
string has moved: `getComputedStyle` measured 8.1us under 6x CPU throttling, and three
runs of one build spread p95 from 9.8 to 10.8 and the worst frame from 13.6 to 110.7,
so a per-frame read is well under the noise. Reduced motion draws once, so it keeps
whatever the accent was at mount.

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
