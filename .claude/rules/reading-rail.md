---
paths:
  - "app/_components/ReadingRail/**"
  - "lib/scroll-column.ts"
  - "components/ScrollFade/**"
---

# The reading rail

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
- **Leaving is ordered, and the order is the cascade's to set**, each part waiting on
  the cascade rather than on a figure picked for one post. **The scroll figure waits on
  `passDuration`**, the last title's fade included, since it is clutter beside a column
  that must be gone. **The veil waits on `walkDuration`**, which is where the boundary
  finishes telling the titles and the column starts emptying everywhere at once: it has
  to outlast them a little, so the rail empties before it lifts rather than under a
  column that has already come back. Named instead of derived, that delay strands itself
  the moment the cascade is repaced, which is exactly what happened: held at 450ms
  against a walk bounded down to 220, it outlasted the titles by 430ms where it was
  tuned for 200. Derived, the gap holds at 200 whatever the count.
- **That walk is bounded, not paced per title alone.** Measured on the design system's
  twenty-five sections, a per-title beat took 908ms to open them all, which reads as the
  rail labouring rather than as a cascade; bounded, the same page opens in 233ms and
  nothing above seven sections costs more than anything else. Bounded rather than fixed,
  because a fixed walk would put that whole span between the only two titles of a short
  post, where the beat should stay brisk: below the bound nothing changes at all.
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
