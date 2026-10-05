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

### The same posts, for something that is not a browser

A post is served twice: as the page, and as `/posts/<slug>/index.md`, which is the
file you wrote. The page is 297KB against the source's 14 and loses the two things a
technical post rests on, measured on the planet post: Shiki splits every keyword into
one of 1027 `<span>`s, so the code arrives unfenced and indistinguishable from prose,
and the thirteen headings arrive unmarked. MathJax renders a formula as vector glyphs,
which is right for an eye and unreadable for anything else.

`lib/post-markdown.ts` is the whole transform and takes two liberties with the source,
each because the original means nothing outside the build: the metadata export becomes
YAML, which something other than a bundler can parse, and a relative media path becomes
absolute. Both are narrower than they look. **Only the imports the file opens with are
dropped**, because a component carrying an example in a prop has lines of it at column
zero: anchoring to every line start cost the design system its `import './scene.css';`
out of a Sandpack. And **a fenced block is never touched at all**, being the subject
rather than the machinery. **The CDN namespace is chosen by extension**, not by a table of components:
`.mp4` goes to videos and everything else to images, so adding a component to
`mdx-components.tsx` can never put a file in the wrong place.

- **`/llms.txt` lists the posts** and points at their Markdown rather than their pages,
  which is the point of it. Drafts are absent, the way they are from the feed, while a
  draft's own `.md` resolves, the way its page does.
- **Both are written at build**, beside the search index and the feed that already
  derive from `getPosts`. Nothing is computed per request.
- **A page says where its source is** through `alternates.types`, so nothing has to
  guess the path. `/llms.txt` is advertised nowhere: the root path is its convention,
  and claiming it as an alternate representation of the homepage would be inventing
  one.
- **Worth knowing before trying `/posts/<slug>.md`**: a route segment cannot mix a
  dynamic part with a suffix. `getSegmentParam` only reads a segment as dynamic when it
  ends in `]`, and strict mode rejects `/posts/[slug].md`, which is why the file sits
  one level down.

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

`components/ModeToggle` is no longer mounted anywhere: the theme is switched from the
palette, with ⌘D. `<html
suppressHydrationWarning>` plus next-themes' injected script avoids the flash. Mobile
chrome colour follows the OS via the `themeColor` viewport export, not the toggle.

### Component layout

- `app/_components/` — page-shell only (DynamicIsland, IndexSection). Not reused outside it.
- `components/` — reusable. Shadcn primitives in `components/ui/` (CLI-generated, avoid
  manual edits). Custom components as `ComponentName/index.ts` + `ComponentName.tsx`,
  or a single flat file.
- Add primitives with `bunx shadcn@latest add <component>`; config in `components.json`.

### Key modules

| Path | What it owns |
|---|---|
| `lib/post-utils.ts` | `getPosts()`: reads and sorts all MDX posts |
| `lib/post-markdown.ts` | A post as the file it was written as, for `/posts/<slug>/index.md` |
| `components/Figure` | The frame every visual shares: surface, controls row, caption |
| `components/Chart` | A figure with axes, on Recharts; `series.ts` is its testable logic |
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

**The Dynamic Island is the page shell**, and it replaced the header and the dock,
which were a placeholder with three dead links. It is a status surface and the door
to the palette, never a menu: one action, whatever it is showing, or it stops being
something a reader can rely on.

The island and the palette agree on the end of an article: the island invites support
and the palette carries that command in `Recommended`, one press away. The island
still only ever opens the palette, whatever it is showing.

`app/_components/DynamicIsland/states/` is a registry like the command one, ordered,
first condition wins, last entry carries none. A state owns its layout and its data
sources; the island owns only the container. States come from two places: ambient
ones derived from the context, and transient ones raised through
`hooks/use-island-store.ts` by anything on the page. `announce()` is the site's only
notification surface, which is why sonner was removed rather than kept beside it.

What the shape forces, none of it obvious:

- **Motion scales the pill, it does not resize it.** Mid-morph the container reads
  `matrix(1.26, 0, 0, 1)` and everything inside is stretched with it. That stretch is
  the effect, so children must not be counter-scaled and must not scale themselves:
  either one puts a second, disagreeing movement on screen.
- **Hover is the only state change a pointer can cause**, so the hint keeps the width
  of whatever it covers. Without that the pill shrinks out from under the pointer
  that raised it and the two states trade places several times a second. It is a
  floor, not a width, or a short title cuts the line off.
- **The lift and the press scale the target, not the pill.** A transform carries the
  hit area with it; on the pill they would reach past their own target and bring the
  oscillation back.
- **A wheel over the island does nothing on its own.** `body` does not scroll and the
  scrolling column is a sibling, so the delta is handed on by hand.
- **A button centres its text**, so the island's content wrapper undoes it once
  rather than every multi-line state fighting the same browser default.
- **A state that reports on something else goes `inert`**, and the positioner is
  what takes `pointer-events-none`, not the button: the positioner is a box of its
  own and keeps catching what the button no longer does. Opened over the very link
  that raised it, the island would otherwise take the pointer off that link, shrink
  back, hand it over again, and oscillate about three times a second.
- **Nothing of one state survives into the next**, and between two sizes far
  apart the island passes through its own resting shape, empty. The content goes
  at once, the box travels alone, and the next state arrives into a pill the size
  it is about to be. Crossing the two over instead was tried and looks worse: a
  large layout and a small one share the screen and the collapse stretches both.
  Traced leaving a card: empty by 40ms, down to 87x37 by 276ms, the next state at
  285ms, settled at 220x44.
- **A shape that empties keeps the corner it had.** Dropped back to the pill's
  radius, a box still card-sized rounds into a pebble and the shape drifts away
  from the one it is leaving. Held, it converges on its own, a corner being
  clamped to half the shorter side once the box is small enough, and Motion
  carries it through the morph as a percentage so the rendered corner never
  moves: 6.5% of 336 and 11% of 199 are both 22px.
- **Measure the pill, never the button.** `layout` animates a transform on the
  pill, and a parent's layout box does not see a child's transform: the button's
  rect snaps between the two sizes in a single frame and makes a working morph
  look like a jump. Three readings were taken off the wrong element before that
  showed up.
- **The scroll progress lives at module scope**, not in the state that draws it: a
  state unmounts on every change of shape and the ring would fall back to zero.

**Hovering a link previews where it goes**, through one delegated listener in
`LinkPreviews` rather than a handler on `Anchor`: every link in every post would
otherwise become a client component, and the delegation catches links no `Anchor`
rendered. It speaks only where a reader cannot already tell: a post behind link
text saying something else, and any external site. The site's own pages are left
alone, their link text being the whole of it.

**It answers twice.** `lib/link-preview/providers.ts` is a registry, like the
command one: each provider matches a URL and reads what the URL alone gives, which
is what the island shows at once. `app/api/link-preview` then fetches the page and
the island morphs as that lands. A reader therefore never waits on a request and
never sees a spinner, and an answer arriving after they have moved on is dropped.
Internal posts are never asked about: the layout already carries their title and
description, and their picture is the OG image we generate anyway. **The index
previews nothing at all**, since it names every post beside its date already and
the card would cover the very list it was repeating.

A provider may also say how to merge what it learns. The default lets the page's
own title win, but one that read a label out of the path keeps it: GitHub's title
repeats the repository, and Bluesky builds its page in the reader's browser, so
its title is just the name of the app.

**The route is the only part that can be dangerous**, and it is reachable by
anyone, not only through a link in a post. So it answers only for hosts a post
actually links to, read off the content once per instance by
`allowed-hosts.ts`: the set is the whole of what a reader can hover, and
anything else is refused before a socket is opened. Fetching whatever it is
handed would otherwise be both a request forgery primitive and someone else's
crawler running on our bill.

Beyond that, `safe-url.ts` checks every address a name resolves to rather than
the name, redirects are walked by hand so that runs again on each hop, the read
is bounded and stops at `</head>`, and every failure answers an empty object.

**Checking the name is not enough, so the address is pinned.** `safe-url.ts`
hands back the address it approved and `pinned-request.ts` gives the socket that
address through `lookup`, because a resolver answering public once is under no
obligation to answer the second lookup the same way, and `fetch` would have made
exactly that second lookup. The request keeps its hostname, so the certificate
and the `Host` header stay the ones the site expects, and `agent: false` is
load-bearing: Node pools sockets by name, and a reused one never reaches the
lookup its request pinned. YouTube goes through oEmbed, which gives the channel their
own tags do not, and falls back to the page when they refuse.

The answer is cached at the edge for a day, so the next reader's hover is instant,
and once per link per page in the browser. The wait before showing keeps a paragraph
of links from flickering; the grace before hiding carries the island from one link
to the next without dropping back in between.

The island is deliberately absent from `content/design-system.mdx`. It is global
chrome, always on screen, and a second one rendered inside an article would be two
islands disagreeing.

**The reading rail is a ruler down the side of an article.** `app/_components/ReadingRail/`:
ticks against the viewport, the reader's place among them in `--primary`, the sections as
longer marks, and their titles unfolding on hover. Clicking anywhere travels there.

Four parts, each with one job. `rail.ts` is the geometry and the comparison, pure, so what
is worth getting right is testable without a DOM. `use-sections.ts` measures, since only
the page knows where a heading sits. `use-cascade.ts` choreographs and owns the pace.
`Tick.tsx` draws.

What the shape forces:

- **The panel answers nothing; two boxes inside it do.** A band at the edge is the only
  way in, 48px to `lg` and 112 after, narrow enough that a pointer crossing the page
  cannot open the rail. What holds it open is a second box the width of the longest
  title and not a pixel more, so leaving is one straight edge to cross at any height.
  Both are shapes the browser hit-tests, which is what spares the rail a threshold read
  on every move and a deferred close to tune. The two obvious regions are both wrong and
  were both shipped: the whole panel means crossing four hundred pixels to leave, the
  titles alone lose the pointer in the two hundred that can separate them.
- **The panel is wider than that target and never animates.** It is the longest title
  plus air, measured, because a title reaching past the veil leaves the column legible
  through the words; a share of the viewport cannot promise that. Animating the width
  re-laid the veil and all fifty ticks on every frame, which is why the hit area is a
  box of its own.
- **The veil only exists below `xl`.** Above it no content passes behind the rail at
  all, so what was left to see was its own quantisation. Below, it earns the cost:
  249px of column sit under the panel at 1024, 311 at 900.
- **Both of its layers carry their ramp as a mask**, from
  `components/ScrollFade/gradients.ts`, the colour one over a flat fill. Painted as a
  gradient of alphas instead, it is `--background` on `--background` over an empty page
  and should be nothing at all, and it lays down steps of about one part in 255 that
  read as a vertical seam: worst column step 0.97 as a gradient against 0.10 as a mask.
  `ScrollFade` is built the same way for the same reason, 1.20 against 0.12 across its
  band, and `gradients.ts` now offers no way to paint a colour ramp at all.
- **The veil holds at full across less than a third of the panel**, then falls along
  `EASED`. Held as far as the title itself it is a flat slab where a dissolve belongs,
  and the blur carries legibility under a title long before the colour has to. A
  straight fall reads as a band with two edges.
- **The veil's radius travels, never its layer's opacity.** A blurred layer is as good
  as fully blurred by half opacity, so fading one in arrives at the middle in a step and
  crawls the rest. `none` at rest, a backdrop filter re-blurring its backdrop every frame
  it is mounted even at no radius at all. The titles' own blur is `none` at both ends for
  the same reason: left at `blur(0)` every one of them holds a composited layer for the
  life of the page.
- **Leaving is ordered, and the order is the cascade's to set.** The veil and the scroll
  figure both wait for the titles, the figure on `passDuration(count)` rather than a
  figure picked for one post: the walk is paced per title, so thirteen sections empty at
  750ms and three at 375.
- **Each title carries a halo in `--background`.** Local contrast at the glyphs is
  cheaper than asking the veil to cover more, and it follows the theme on its own. It
  does nothing above `xl`, nothing being behind it there; judge it at 820, where 231px
  of column run under the titles.
- **The rail is `aria-hidden` and holds nothing focusable**, on purpose: it is a second
  way to reach headings that already carry their own anchors, it exists only under a
  fine pointer, and a ruler of fifty ticks read aloud is noise. Give it a keyboard path
  only by giving it something the article does not already offer.
- **Only the article's own headings count**, which is what `data-prose` on the post's
  prose wrapper is for: a card or a disclosure carries a heading of its own, and a
  widget's title is not a place in the article.
- **Most posts have no headings at all**, so the rail has to be a ruler without them, and
  its drawer must not open on nothing. Reading a title's state off an array sized by the
  sections once took every one of those pages down with it, blank. The cascade is keyed
  by section now, so there is no index to get wrong.
- **A reading is compared on `progress`, not only on where the heading sits.** A shorter
  viewport leaves every heading where it was and still lengthens the travel under it, so
  `sameSections` would otherwise hold a stale place on the rail.
- **The reader's place is a tick, never a line laid over one.** Two marks at one place
  cannot stay lined up, and a tick that is already the mark has nothing to add on hover.
- **The landing is the rail's alone.** A heading's own `scroll-mt` is for its anchor link;
  counting both put an h2 twice as far down as an h3. A section's place on the ruler is
  measured from the landing too, or the mark misses the title just clicked.
- **Nothing re-renders while scrolling** but the two ticks that trade the mark, which is
  what `memo` on the row is for: the rail costs 76-100ms of scripting over 300 scroll
  frames against 62-89 with no rail at all.
- **The cascade holds no delay.** A delay has to run out before its title moves, so a
  pointer in and out faster than the cascade strands whatever was still waiting. A
  boundary walks the titles instead and tells each one once, so a reversal is a new walk
  rather than the old one rewinding, which is what ran it back up the rail. A reversal
  walks only as far as the last pass reached, that being all it can have left wrong.
- **jsdom can reach none of this.** Its `ResizeObserver` is a stub and every box is zero
  high, so the rail lays out no tick there at all: a DOM test can only show that the
  component stands. Anything worth asserting belongs in `rail.ts` or `passDuration`.

`lib/scroll-column.ts` owns the scrolling column: the page does not scroll in `body`, so
chrome fixed over it is a sibling and a wheel landing there reaches nothing on its own.
The island and the rail both hand it on from there.

**The accent is a reader's choice, out of seventeen presets.** `lib/hues.ts` is the
whole list; everything else reads it. One row in `Tools` opens a page of the palette,
and the choosing happens there.

- **The names come from Tailwind's palette, and so do the angles**, which is the only
  way a name stays honest. The site shipped 262.04 as "Violet" for a long time; that is
  Tailwind's *blue* at 259.8, and the real violet is at 292.7. The default is Blue now,
  and `hues.test.ts` checks every preset against Tailwind's own figure.
- **The accent has its own lightness**, `--accent-l`, where every other token takes
  only the hue. It needs one: the accent carries far more chroma than anything else, so
  rotating it alone drops `--primary` on white from 4.06 at the warm end to 3.17 at
  teal, well under what the site shipped. Nine presets carry a lightness that buys it
  back, by at most 0.05. Measured on the page after the change, teal in light mode
  reads 3.84 where it read 3.17.
- **The floor is checked, not asserted.** `hues.test.ts` converts oklch to sRGB itself
  and fails a preset that falls under 3.79 in light or 4.5 in dark. The conversion is
  test-only and agrees with Chrome to within 0.02 of a ratio.
- **There is no Neutral, and that is the answer rather than an omission.** Zeroing the
  accent's chroma only reaches `--primary`: every other token carries its own and
  points at whatever angle is set, so a grey accent sat on a pink page. Measured under
  it, `--subtle-foreground` came out 170,138,147, thirty-two points of 255 apart across
  its channels, where `--primary` was a flat 131,131,131. A preset turns the wheel and
  grey is not on it; making it honest would mean all 88 token definitions taking a
  chroma multiplier.
- **A blocking script paints it before the first frame**, built in `app/layout.tsx`
  from `HUES` itself so a preset cannot exist there and nowhere else. Left to React the
  page paints the default and corrects it on hydration, which is a flash of the wrong
  colour. Measured on a cold load with a preset stored: the right accent at readyState
  `interactive`, at the first frame, at first contentful paint, in both themes.
- **The mark reads itself in, letter by letter**, on the grammar `ZoomCaption` uses
  under a zoomed image: a 6px blur per glyph, staggered left to right, and leaving
  mirrors it last letter first so the mark hands over to the row that takes it rather
  than blinking out. Measured mid-reveal, the seven letters sit at 0.96 down to 0.20.
- **The chooser opens on the accent in force**, so the reader starts from where they
  are. The selection is set a frame late, cmdk putting its own highlight on the first
  row as the rows mount. **Hovering a row does not preview it**: tried, and a page
  that rethemes under a pointer merely passing over a list is more startling than it
  is useful.
- **`--base-hue` in `globals.css` is the angle `DEFAULT_HUE` names**, or the two
  disagree and the page shifts the moment anything reads a preset.
- **Picking applies in place and the page stays open.** Every other command acts and
  the palette shuts behind it; a chooser has to let one accent be compared with the
  next.
- **The swatch is two discs and a cut, and the cut is a mask.** A border would be a
  colour that has to match whatever sits behind it, on a panel, in either theme, under
  any accent; a mask makes the separation the surface itself. The disc behind is mixed
  into the page rather than laid over it at an alpha, for the same reason the text
  tiers are named colours.
- **Nothing else had to change**, which was the point of the token architecture: the
  shader follows because `Backdrop` reads the accent every frame, and the syntax
  highlighting follows because `config/code-theme.ts` emits `var(--shiki-token-*)`
  rather than literal colours.

**The command palette is a registry, not a component full of items.**
`lib/commands/registry.ts` is a list of `{ id, label, icon, group, keywords, run }`,
and `components/CommandPalette` only renders it and hands each `run` the page's router
and theme. Adding a command is one entry; nothing about the surface changes. `run`
takes a context rather than reaching for hooks itself, which is what keeps the registry
a plain module a test can read.

A command either acts on the site or **opens a page of the palette**, never both;
the `Command` union keeps the pair from being written together. `search` and `accent`
are the pages, and they force four things worth knowing before opening the files:

- **A page ranks its own rows**, so cmdk gets `shouldFilter={false}` and the selection
  is driven from outside through `onResults`. cmdk moves it when *its* search box
  changes and at no other time.
- **Backspace-to-leave is read on the cmdk root**, not the input, and the input is
  focused by hand when a page opens: a row reached with the mouse keeps the focus.
  **`BackHint` is what says so**, at the end of the input row, and only while the box
  is empty, which is the only time the key does that: with a query in hand it deletes
  a character, and a hint promising otherwise is worse than none. It is the target as
  well, so a mouse is not left with Escape alone, and it hands the box back its focus
  on the way out, the button leaving with the page it belongs to. **cmdk reads Enter on
  its root** and runs whatever row is highlighted, so a button inside it is reachable by
  Tab and dead on arrival until the key is stopped at the button.
- **cmdk nulls `onPointerMove` on a disabled row**, hence `onPointerEnter` for the
  disabled hover, and it refuses to select such a row at all.
- **A list swapped wholesale needs a new `key`**: `FadingList` finds the scrolling
  node once, at mount.

The index is built at build time by `lib/search/build-index.ts` and served static by
`app/search-index.json/route.ts`, **fetched on the first thing typed and not before**.
The unsearched list is the server's, handed to the palette as `posts`: drawn from the
index it arrived after the page did, so a cold load opened the search page on a line of
text and then resized it under the reader once the archive landed. Between a keystroke
and the index there is a plain match on title and description, so the panel keeps
something true on screen for the length of the fetch and never shows a post that does
not answer what was typed. **`INDEX_OPTIONS`
is shared by the build and the browser on purpose**: `loadJSON` reads an index against
the options it is handed, so the two drifting apart stops matching rather than failing.
`lib/search/query.ts` holds the engine, which is what keeps the view free of MiniSearch
and the ranking testable without a DOM.

A command may also say **when it is worth recommending**, which lifts it out of its
group and to the top of the palette. Lifted, not copied: one command is one row, or
cmdk returns two of them for the same search. The section exists only when something
asks for it, holds five at most, and reads in the palette's own group order rather
than the registry's. `lib/commands/recommend.ts` is the whole policy, testable
without a DOM.

Three moments ask for something today: the index, an article underway, and an
article finished. A reader who has only just arrived at an article is offered
nothing, having made no move yet to answer.

What the reader has scrolled is in the context too, which is what lets a command
withhold itself: `Go to top` is not offered to someone already there.
`hooks/use-scroll-tracking.ts` owns that reading for both the palette and the
island, and **hands back the object it already holds when nothing has moved**: a
fresh one per scroll event re-renders both of them sixty times a second to say
nothing changed, which measured 189ms of scripting over 300 frames against 79ms
once it stopped.

`components/ui/command.tsx` is customized beyond the CLI output six times over: its
`CommandInput` is laid out inline rather than through `InputGroup` and takes a `hint`
slot at the end of its row, a selected item carries `--primary` rather than
`--foreground`, **`CommandHint` names what a row says on its
right** and lifts it with the selection the way a shortcut does, since the one
thing on the line that does not answer the selection reads as disabled (it is
exported as a class too, for a mark that has to be a motion element to animate
its own exit), **a row's selection is not transitioned** and
**the dialog travels its backdrop's radius on the way out** rather
than only its opacity. The row eased its colour and its wash over 100ms while
the icon, whose colour is set on the `svg` and carries no transition of its
own, snapped: one change arriving at two speeds. Only the press is animated
now, which is the same reason the reading rail's titles take their accent at
once. A blurred backdrop is as good as fully blurred at an opacity of
zero, so fading alone held the page blurred to the last frame and let it snap back,
which reads as a missing exit where there is detail behind the panel. The closed value
keeps the same function list, or there is nothing to interpolate between and it jumps
all the same. Update it with
`bunx shadcn@latest add command --diff` and re-apply, and note that overriding the
selected colour from a caller's `className` does not work: `cn()` drops it as a
conflict with the primitive's own, silently.

**A page of the palette is an entry in `lib/commands/pages.ts`**, holding its prompt and
whether it ranks its own rows. `Page` is the map's keys, so a page that is not described
there cannot be opened, and a new one is a line plus a branch rather than a condition
spread across the view. `search` ranks for itself and tells cmdk to stand down; `accent`
lets cmdk filter four names.

- **One pane is mounted at a time, which `AnimatePresence mode="wait"` is for.** A page
  is a `CommandList`, and two of them inside one `Command` would have cmdk ranking and
  arrowing through rows nobody can see. The reveal reads the same for it: the pane
  leaves to one side under a blur, the next arrives from the other.
- **The blur is the movement's own**, so it resolves to `none` through `transitionEnd`
  rather than resting at `blur(0)`, which would leave every pane holding a composited
  layer for the life of the palette.
- **The box travels with its contents, and `layout` cannot do it.** Motion's layout
  animation transforms the element and lets the real box jump, which is exactly what
  the dialog sizes itself to: measured, it still took 222px in a single frame. The
  height is measured off the pane with a `ResizeObserver` and animated for real, and it
  holds through the gap between one pane leaving and the next arriving because the
  observer has nothing to watch there. **The box keeps a floor of five rows**, or
  filtering to a single command drops it to one and the page it opens climbs
  all the way back out, which reads as a pulse rather than as a list
  narrowing. Deeper than five and an empty result is mostly void.
  **Only a swap travels**, never a filter: the
  first reading from a pane is the swap, everything after it is the list
  narrowing under a box that should simply follow, and easing down to meet it
  and back up again reads as the dialog breathing rather than as rows going
  away. Held on the observation rather than cleared when the animation ends,
  which never fires for two panes that happen to be the same height.
  **Only the arriving pane is measured**, which the `data-pane` guard is for: entering a page clears the box too, so the pane on its
  way out re-renders unfiltered and swells back to full height first, and following it
  grew the dialog to meet a list nobody would see before dropping to the page's own
  size. 33 frames where there was one, and typing in the
  root stopped snapping as well.

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
  invalid `blur()`. **`backdrop-filter` is no safer**: the palette's exit asked for
  `blur(0px) saturate(1.15)` and shipped `blur()saturate(1.15)`, which takes the whole
  declaration with it. Where a zero cannot be avoided, half a pixel survives the
  minifier and is not visible.

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

**A visual in an article is one of three things, and the frame is all they share.**
`components/Figure` holds a block of rhythm, a row for whatever drives it, and a
caption, and **it never knows what it contains**: the moment it starts to, it is the catch-all this
file spends its length avoiding. On top of it:

**A figure draws no surface.** It sits in the prose rather than in a box: a card around
it fences it off from the paragraph that introduces it, and a figure above a `Card`
reads as a list of panels rather than as an article. One that genuinely needs an edge,
such as a canvas whose content runs to its own bounds, draws its own.

- **A chart carries axes**, so it is `components/Chart` on Recharts, through shadcn's
  `ui/chart.tsx`. `type` picks the plot and the mark together, which is the whole of
  Recharts' model: `AreaChart` plus `Area`, `BarChart` plus `Bar`. **A kind with no
  axes gets its own component** rather than a fourth value of `type`: a pie's parts and
  a radar's spokes are different claims about data than a series over a scale, and
  forcing them through one prop shape would make that shape a lie. `PieChart` and
  `Polar.tsx`'s `RadarChart` and `RadialChart` share the frame, the legend and the
  tooltip, and nothing else. **A radial's scale lives on a hidden `PolarAngleAxis`**:
  left off, every arc fills its own ring and the comparison the chart exists for goes.
- **A drawn figure carries none**, so it is a component in `components/figures/` and no
  library at all. The scale is a subtraction and a multiply; reach for `d3-scale` when
  the mapping stops being linear, not before.
- **A rendered surface** is a canvas, which `Backdrop` already shows how to hold. There
  is no harness for it yet, and three.js is deliberately not installed: 150KB for a
  figure that does not exist is how a dependency arrives and never earns itself.

What the shape forces:

- **A decoration goes inside the chart, never beside it.** Recharts v3 hands any child
  the scales the chart already built, through `useXAxisScale`, `usePlotArea` and the
  rest, so a child paints into the plot's own SVG and lines up by construction. It
  paints on the client only, `usePlotArea` having nothing to measure on the server.
- **The legend is ours, the tooltip is shadcn's customised.** Recharts orders its legend
  by payload rather than by the series as declared, and a series a reader can switch off
  is most of the point on an explanatory chart, so that one is written here; the last
  visible series cannot be hidden, an empty plot reading as a bug. The tooltip stays
  theirs because everything wrong with it was skin: `ui/chart.tsx` now gives it the
  glass, a round mark and the heading set off by a rule, and is updated with
  `bunx shadcn@latest add chart --diff` like `badge`, `card` and `command`.
- **Its mark is drawn outside the `formatter` branch**, which is a real fix rather than
  a restyle: upstream renders the indicator only in the else of `formatter`, so the
  moment a caller wants a unit on its numbers the coloured dot silently disappears.
- **The type is set on `svg text`, which is the only rule that holds.** Naming a class
  means naming the wrong one: the generated file styles
  `.recharts-cartesian-axis-tick text`, which Recharts 3.8 does not emit, and a rule
  scoped to the cartesian tick leaves a radar's own labels on Recharts' default grey.
  Measured across radar and radial: DepartureMono on `--subtle-foreground` throughout.
- **`ui/chart.tsx` ships a selector Recharts 3.8 no longer matches.** The generated file
  styles `.recharts-cartesian-axis-tick text`, but the tick's text now carries
  `.recharts-cartesian-axis-tick-value` under a `.recharts-cartesian-axis-tick-label`
  layer, so neither the fill nor anything else landed: the grey ticks were Recharts'
  own default, not a token. Measure a computed style before believing a class applied.
  **The font is set on `svg text` rather than on any of those names**, which is both
  broader (a pie's own labels are not axis ticks) and proof against the next rename.
- **An area's gradient is a word, not markup.** Recharts has no gradient prop, so
  shadcn's "gradient" block is a `<defs>` a caller copies; owning the marks turns it
  into `fill="gradient"`. **The ids come from `useId()`**, where their example hardcodes
  `fillDesktop` and `fillMobile`: an id is document-wide, so a second chart on the page
  would take the first one's fill. Two other deliberate departures from that example:
  the curve stays `monotone` rather than `natural`, which swings past a reading, and
  the areas overlay rather than stacking, stacking being a different claim about the
  data than these figures make.
- **A mark is handed the colour to paint**, never `var(--color-<key>)` built from its
  key. That variable is written by `ChartStyle` out of the config, which is built on
  the server, so a colour only the browser can resolve would never reach the line.
- **A chart draws itself when it is first scrolled to**, cartesian and pie alike.
  `use-entry.ts` holds the marks back until an `IntersectionObserver` sees the plot,
  which costs nothing: measured, the static HTML carries the frame, the grid, the axes
  and the legend but **no series path at all**, so there is no server-rendered curve
  for an entry to reset and no layout to shift when one arrives.
- **Nothing needs to stop afterwards, and an earlier version of this file said it did.**
  Recharts interpolates a path toward its new shape rather than redrawing it from the
  start: measured across a toggle, the surviving series hold a `stroke-dasharray` equal
  to their own length throughout, fully drawn, while the axis rescales under them. That
  rescale is the transition worth seeing, and killing it to prevent a redraw that does
  not happen cost the site every chart's animation.
- **The tooltip's heading is read off the payload, not from its `label`.** Shadcn
  resolves that label through the config whenever it is not a string, so on a numeric
  axis the panel was headed with a series' name rather than with the x value.
- **The legend sits above the plot**, being the key to what follows: read after the
  curves it explains something already guessed at, and under them it competes with the
  caption for the same job.
- **Both wear `components/ui/glass`**, the site's one translucent material: the Dynamic
  Island's own recipe, which the island, `ui/select.tsx`, the tooltip and the legend all
  now take. It is `--card/75` rather than a `--wash` step **because `--card` is defined
  in both themes**: a single translucency cannot be right over a light page and a dark
  one, and a panel that has to be read needs the surface under its text to follow the
  theme rather than tint it. The 115% saturation is load-bearing, a plain blur greying
  what it covers. `BeforeAfterSlider`'s handle deliberately keeps its own heavier fill,
  floating over photography rather than over the page.
- **The tick numbers are the axis labels' own type**, Departure Mono on the third text
  tier, which is what makes an axis read as one thing rather than as a chart's numbers
  beside our words. Set through a class on the container, since `XAxis`'s `tick` prop
  takes SVG attributes and cannot name a font variable.
  **Its colours are resolved rather than named**: `--color-<key>` is scoped to the chart
  container by `ChartStyle`, and the legend is outside it, so `var(--color-webgl)` there
  resolves to nothing and the dots come out blank.
- **A pie's legend is a key, not a set of toggles.** Switching a slice off changes what
  the whole is, so the figure would quietly answer a different question than its caption.
- **The axis labels are ours too.** `XAxis`'s own `label` positions against the plot and
  lands on top of the tick text at this size. Ours are boxes in the layout, so they
  cannot collide, and they carry the figure's typography rather than the chart's. They
  live in **a grid, not in nested boxes**: the vertical one then centres on the plot's
  own row rather than on the whole column, which had been putting it a legend and an
  axis label too low.
- **The five chart tokens are shades of one accent**, not five hues, so a sixth series
  repeats the first. A series may name its own colour, and should **only** when the
  colour is the subject: a curve labelled Green drawn in the site's accent is absurd,
  and a wavelength does not follow the reader's theme.
- **A control in the frame's row stretches.** Flex children shrink to their content by
  default, which rendered the sampling diagram's slider as a label and a readout jammed
  together with no bar between them.
- **`components/Slider` can now be driven**, through `value` and `onValueChange`, and
  stays uncontrolled without them. Named after the primitive rather than `onChange`,
  which would shadow the DOM handler of the same name on its root.

**`components/figures/ConfusionMatrix` is finished but unlisted.** Registered in
`mdx-components.tsx`, absent from the design system: a figure waiting for the post that
needs it, not something the system should show off before one does. It is a heatmap and
a table at once. It is the
form this data is read in everywhere it appears, so the cells sit flush as a grid with
a scale bar beside them; it is also tabular, so underneath it is a real `table` whose
counts stay selectable and whose cells a screen reader reads with their row and column.
No JavaScript.

**`--heat-from` and `--heat-to` exist because no other token can stand in.** The ramp
has to run from the page toward a far end that stays legible under inverted text, and
**the direction of that run flips with the theme**: pale to deep in light, deep to
bright in dark. That flip is what lets one threshold serve both, the count going to
`--background` past 58% of the ramp, `--background` being the opposite of the far end
in either theme. Measured across 36 cells, the worst is 8.5:1 in dark and 6.78:1 in
light. An earlier version mixed `--primary` into the surface and inverted to
`--primary-foreground`: white on full `--primary` is 3.79:1 in both themes and 2.16:1
on a half-mixed cell in light.

**Its column headers are named above them, not below.** A browser renders `thead`
first whatever the source order, so an axis named at the far end of the grid from the
labels it names belongs to neither.

**Its cells are square and spaced**, a continuous field reading as an image where
separated tiles read as counts. A `colgroup` carries the widths: `table-fixed` gives an
unsized column no width at all, so the row labels had been overflowing onto the first
cell, and sizing from the header row made a short label like SEA a narrow column.
**Nothing moves on hover** either, a tile that grows pushing its neighbours' edges out
of line so the grid stops reading as a grid; a hairline drawn inside its own bounds
says the same and leaves the field still. It is a client component **only for the hover readout**, which
earns itself: every row of a confusion matrix means "of all the Xs, how many were
called Y", and the grid alone makes a reader count along two axes to recover that
sentence.

**Measure a `color-mix` through a canvas, never through `getComputedStyle` alone.**
Chrome hands back `oklab(...)` and `lab(...)`, so a contrast check that parses the
string for three numbers reads the wrong components and invents a failure: the first
run of the above reported every cell under 4.5 and seven different tints as the same
2.51. Paint the colour into a 1x1 canvas and read the pixel.

**`bunx shadcn@latest add chart` pulls `cn` from npm** and imports from it, where every
other primitive here takes `cn` from `@/lib/utils`. Repoint the import and remove the
package.

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
