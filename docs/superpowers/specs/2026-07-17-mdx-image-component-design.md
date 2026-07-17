# MDX Image component — design

Date: 2026-07-17
Branch: `feat/image-component`
Status: implemented. See "Corrections found during implementation" for where reality differed.

## Goal

Port the zoomable image component from Maxime Heckel's blog to this codebase, adapted to
Next.js 16 App Router, Tailwind v4, Radix primitives and the shadcn methodology.

Two success criteria, equally weighted:

1. **Authoring simplicity** — declaring an image in a post must be as close to trivial as possible.
2. **Runtime quality** — optimized responsive images, no CLS, no layout jank, accessible, themable.

## Authoring API

```mdx
<Image src="shade-of-halftone/circle-sdf.png" alt="Diagram breaking down the distance field..." />
```

- `src` is a **path relative to the media kind's prefix**. The CDN bucket is namespaced
  (`images/…`, `videos/…`), so `resolveImageUrl('blog/halftone.png')` yields
  `{cdnUrl}/images/blog/halftone.png`. Origin and layout both live in `config/site.ts`.
  Absolute `http(s)://` sources are passed through untouched.
- `alt` is required. It doubles as the `<figcaption>` and as the dialog's accessible title.
- `width` / `height` are **optional**. When omitted they are resolved at build time (see below).
  When supplied they are used as-is and no network call happens.
- `priority` is forwarded to `next/image` for above-the-fold images.

Markdown `![alt](src)` is remapped onto the same component, so both syntaxes behave identically.

## Image pipeline

Cloudflare image transformations (`/cdn-cgi/image/…`) are **not enabled** on the zone — verified,
it returns 404 while the origin object returns 200. Maxime's `cloudflareLoader` therefore cannot
be ported as-is.

Decision: **Next.js optimizer**, not a `next/image` custom loader.

This distinction is load-bearing. Passing a `loader` prop to `next/image` makes Next bypass its
own optimizer entirely and serve the loader's URL verbatim — which is precisely why Maxime needs
Cloudflare to do the resizing. Here, `resolveImageSrc()` is a plain URL resolver applied *before*
`src`, and `remotePatterns` lets Next's optimizer handle resize / webp / avif.

Switching to Cloudflare transforms later means rewriting one function and adding a `loader` prop.

`next.config.ts`:

- `images.remotePatterns` → `cdn.lenysauzet.com`
- `images.qualities: [75, 100]` — Next 16 requires an explicit allowlist.

## Build-time dimension resolution

`next/image` requires `width`/`height` to reserve space and avoid CLS. The CDN does not expose
dimensions, and hardcoding them per image (Maxime's approach) is tedious and drifts from reality.

Since every post is statically generated (`dynamicParams = false`), dimensions are resolved at
**build time** by an async Server Component:

1. `fetch` the image with a `Range: bytes=0-65535` header.
2. Parse the header with `image-size`.
3. Memoize with React `cache()` so repeated sources cost one request per build.

Verified against the real CDN: it answers `206 Partial Content` and `image-size` parses the
truncated buffer correctly (`test.png` → 960×731).

Trade-off accepted: the build gains a network dependency on the CDN. Mitigated by the explicit
`width`/`height` override. A probe failure **fails the build with an explicit error** rather than
degrading silently — a missing dimension would otherwise ship as CLS.

Zero runtime cost: this happens once, at build.

## Component boundaries

The RSC boundary falls at the natural seam: **data resolution vs. interaction**.

| File | Responsibility | Depends on |
|---|---|---|
| `components/Image/Image.tsx` | Server, async. Resolves URL + dimensions, renders `<figure>` and caption as pure SSR HTML. | `lib/image-utils`, `ImageZoom` |
| `components/Image/ImageZoom.tsx` | `'use client'`. Owns dialog state and the Motion morph. Receives serializable props only. | `Lightbox`, `motion/react` |
| `components/Image/Lightbox.tsx` | `'use client'`. Styled Radix dialog surfaces (backdrop, popup, trigger). No zoom logic. | `radix-ui` |
| `components/Image/index.ts` | Public export. | — |
| `lib/image-utils.ts` | `resolveImageSrc()`, `getImageSize()`. Pure, testable, the only place that knows the CDN exists. | `image-size` |

### Why not `components/ui/dialog.tsx`

Rejected after drafting it. A `bare` variant and the `default` variant share only
`z-50 outline-none`; everything else (`bg-popover`, `p-6`, `ring-1`, transform-based centering)
would be negated. A variant whose purpose is to cancel the default variant is two components
sharing one name. It would also be clobbered by shadcn CLI regeneration, which `CLAUDE.md`
explicitly protects.

`Lightbox.tsx` composes the raw Radix `Dialog` primitives instead, and stays colocated inside
`components/Image/` — it is **not** promoted to a global primitive until a second consumer exists.

### Why not `@base-ui/react`

Maxime uses Base UI because it is his design system's primitive layer. Here, `radix-ui` is the
primitive layer (`components/ui/*`), so the dialog composes Radix.

`@base-ui/react` **stays**: `components/ui/combobox.tsx` imports it, because Radix ships no
combobox. An earlier claim that nothing imported it came from a malformed grep.

## Interaction model

`DialogContent` must **not** sit under a transformed ancestor: Motion's layout projection measures
bounding boxes, and a `translate(-50%, -50%)` parent corrupts the math. The lightbox surface is
`fixed inset-0 grid place-items-center` — no transform.

The morph requires `<DialogPortal forceMount>` wrapped in `AnimatePresence`; Radix otherwise
unmounts content instantly and kills the exit animation.

| State | Behaviour |
|---|---|
| rest | `scale: 1`, `cursor-zoom-in` |
| hover | `whileHover` → `scale: 1.02` |
| press | `whileTap` → `scale: 0.95` |
| release → zoomed | shared `layoutId` morph, spring `bounce: 0.35` |
| zoomed | `cursor-zoom-out`; click anywhere or Escape closes |
| zoomed → rest | same spring, interruptible mid-flight |

Because the content surface covers the viewport, Radix's outside-click never fires — closing is
wired explicitly via `onClick` on the surface. Escape and focus trap come from Radix for free.

There is **no close button**. The whole surface is the dismiss target, which the zoom-out cursor
advertises, so a button would be a second affordance for the same action sitting on top of the
one it duplicates. Escape covers the keyboard, and Radix focuses the surface itself when it
holds nothing focusable, so the dialog stays reachable.

### Easing

`type: 'spring', bounce: 0.35` rather than a strict Penner `easeOutElastic`. On a `layoutId`
morph the easing drives the image's *dimensions*, not a detached scale: elastic's ~10% overshoot
would push the zoomed image past the viewport, and a fixed-duration curve cannot be interrupted
cleanly when the user re-clicks mid-flight. A bouncy spring reads as elastic, stays inside
bounds, and resumes from current velocity.

## Accessibility

- `alt` required; rendered as `<figcaption>` and as an `sr-only` `DialogTitle` (Radix warns without one).
- Trigger is keyboard-focusable, activates on Enter/Space, with a visible focus ring.
- The zoomed copy carries `alt=""`: the dialog title already names it, so announcing it twice
  would be noise.
- Focus trap, `aria-modal`, scroll lock, Escape: inherited from Radix.
- `useReducedMotion()` disables scale and morph — the dialog opens instantly, the image stays reachable.

## Theming

No hardcoded colors, spacing or durations. Semantic tokens only (`bg-background/80`, `border-border`,
`--duration-*`, `--ease-*`), so a theme change propagates without touching this component.
Conditional classes via `cn()`.

## Removals

- `RoundedImage` in `mdx-components.tsx` — superseded.
- `@base-ui/react` — unused dependency.

## Verification

1. `bun lint` and `bun build` — output pasted, not summarized.
2. Dev server on a test post using `test.png`.
3. Screenshots of both states (inline + zoomed), in light and dark mode.
4. Confirm no CLS on load and that the build fails loudly on an unknown `src`.

## Corrections found during implementation

Kept as a record of what the design got wrong before contact with the code.

1. **No Radix Overlay.** The design paired an Overlay with a Content. In practice the surface
   spans the viewport, so the Overlay contributed only the scrim, while the focus trap and
   scroll lock already come from Content. Worse, wrapping the two siblings in a fragment left
   `AnimatePresence` — which tracks only its *direct* children — with nothing to animate, so the
   subtree never unmounted. The surface is now a single keyed child.

2. **The scrim fades a custom property, not `opacity`.** Fading the element's own opacity would
   drag the morphing image along with it. Animating `--scrim-opacity` inside an
   `oklch(from var(--background) …)` background isolates the scrim from its children.

3. **The zoomed image is bounded on both axes.** `width: 80dvw` alone let a tall image outgrow
   the viewport. Width is now solved through the known aspect ratio —
   `min(80dvw, calc(ZOOM_MAX_BLOCK_SIZE * w / h))` — which fits both axes without letterboxing
   or distortion. Capping `max-w`/`max-h` with `w-auto` was tried and rejected: it renders at
   the image's natural size instead of scaling up.

4. **The surface sits at `z-100`**, since the site header also claims `z-50` and winning that
   tie on portal DOM order alone is fragile. An earlier revision also reserved the header band
   with `sm:pt-24` / `max-sm:pb-24`; that existed only to keep the close button off the nav and
   went away with the button.

5. **`remark-unwrap-images` is pinned to 4.0.1.** The 5.0.0 tarball on npm contains only
   `package.json` and `readme.md` — a broken publish upstream. The plugin is also referenced by
   name, not imported: Turbopack resolves it itself, and `next.config.ts` compiles to CommonJS,
   which cannot require an ESM-only package.

6. **Dismissal is tested on Lightbox, not ImageZoom.** Under jsdom every element measures zero,
   so the shared-layout morph never settles and the subtree stays mounted. A real browser
   unmounts it cleanly, with focus restored to the trigger — verified via Playwright. Lightbox
   carries no `layoutId`, so its exit completes and the assertion is meaningful there.

## Verified

- `bun run lint` — 0 errors (4 warnings, all pre-existing in `TextScramble`/`MediaPlayer`).
- `bunx tsc --noEmit` — clean.
- `bun run test` — 31 tests, 5 files, all passing.
- `bun run build` — succeeds; all 13 posts prerender.
- Browser (Playwright, 1200×762): `cursor: zoom-in` inline → `zoom-out` zoomed; dimensions
  probed to 960×731 from the CDN; scrim resolves to `oklch(0.1468 0.01 262.04 / 0.8)`; zoomed
  image 749×570, aspect preserved, fits the viewport, close button clears the header; Escape
  unmounts the dialog and returns focus to the trigger.

### Not verified

Light mode. `app/layout.tsx` hardcodes `dark` on `<body>`, so the site renders dark regardless
of `ThemeProvider`. Pre-existing and outside this branch. Token usage was verified instead: the
component hardcodes no color, and every value resolves from a semantic token.

## Out of scope

- `content/shade-of-halftone.mdx` still sources its video from Maxime's CDN. Tracked separately.
- Promoting `Lightbox` to a shared primitive.
- Cloudflare image transformations.
