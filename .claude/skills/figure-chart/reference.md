# Charts: what Recharts forces

Contents: [The model](#the-model), [What a chart forces](#what-a-chart-forces), [ConfusionMatrix](#confusionmatrix), [Installing primitives](#installing-primitives).

## The model

- **A chart carries axes**, so it is `components/Chart` on Recharts, through shadcn's
  `ui/chart.tsx`. `type` picks the plot and the mark together, which is the whole of
  Recharts' model: `AreaChart` plus `Area`, `BarChart` plus `Bar`. **A kind with no
  axes gets its own component** rather than a fourth value of `type`: a pie's parts and
  a radar's spokes are different claims about data than a series over a scale, and
  forcing them through one prop shape would make that shape a lie. `PieChart` and
  `Polar.tsx`'s `RadarChart` and `RadialChart` share the frame, the legend and the
  tooltip, and nothing else. **A radial's scale lives on a hidden `PolarAngleAxis`**:
  left off, every arc fills its own ring and the comparison the chart exists for goes.

## What a chart forces

- **A decoration goes inside the chart, never beside it.** Recharts v3 hands any child
  the scales the chart already built, through `useXAxisScale`, `usePlotArea` and the
  rest, so a child paints into the plot's own SVG and lines up by construction. It
  paints on the client only, `usePlotArea` having nothing to measure on the server.
- **A series, a slice and a spoke are the same thing to `series.ts`.** `resolve` hands
  each the colour it will paint with and `configOf` turns that into the config
  `ChartStyle` reads, so the cartesian chart, the pie and the two polar charts share one
  definition of what a series is rather than three near-copies of it.
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
- **Recharts' tooltip cursor defaults to a hardcoded `#ccc`**, and the generated file
  tokenises it for rectangles and curves but not for sectors, which is what a polar
  chart draws: measured, a radar's cursor computes to `--border` while a radial's stayed
  on `rgb(204,204,204)`, a pale ring over a dark page. The rule covers sectors now.
  **The radial then turns its cursor off anyway**: Recharts draws it as the whole band
  at the hovered radius rather than as the arc under the pointer, so even tokenised it
  is a stray ring around a chart that already highlights itself.
- **A bar's hover band is a wash of `--foreground`, not `--muted`.** The generated file
  reaches for `--muted`, which is not symmetric between the themes: measured against
  its own page, that band is 1.32:1 in dark and 1.099:1 in light, so the dark one reads
  a third stronger. An alpha of the foreground inverts with the theme by construction
  and lands at 1.087 and 1.11.
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
- **A pie needs `animationBegin={0}`.** Recharts holds one back before it starts where
  every other mark begins at once: `Pie.d.ts` declares `animationBegin: 400` against
  `RadialBar`'s 0. Measured from the same visibility gate, a pie's sectors arrived
  441ms after its container where bars took 8, a line 11 and a radial 44, which reads
  as the chart having stalled. At 0 it is 40ms. **Its sectors still appear fully formed
  rather than sweeping**, which is unresolved: `d` is constant across the entry, and
  neither feeding the mark an empty array first nor holding the mark back changes it.
- **A chart draws itself when it is first scrolled to**, cartesian and pie alike.
  `use-entry.ts` holds the marks back until an `IntersectionObserver` sees the plot,
  which costs nothing: measured, the static HTML carries the frame, the grid, the axes
  and the legend but **no series path at all**, so there is no server-rendered curve
  for an entry to reset and no layout to shift when one arrives.
- **The entry's dash is cleared once it is over**, which is the one thing `settled`
  exists for. Recharts drives the draw-in with a `stroke-dasharray` set to the path's
  whole length, and recomputes that figure at the start and the end of an animation but
  not per frame. A toggle rescales the axis, which lengthens the path while the figure
  stands still, so the tail beyond it falls in the gap: measured, 702px of path against
  a dasharray of 627 left **75px of curve unpainted**, stopping short of the last tick.
  Cleared, the worst gap across a toggle and back is 0px and the path still moves over
  157 frames.
- **The mark for that override is a trailing `!`.** `[stroke-dasharray:none!important]`
  is not a class Tailwind v4 compiles: it lands in the DOM and generates no rule at
  all, which looks exactly like a working fix until the computed value is read. Same
  family as `outline-none` and `blur(0)`: a class that is valid to the eye and absent
  from the stylesheet.
- **Nothing needs to stop afterwards.**
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
- **The tooltip and the legend wear `components/ui/glass`**, the site's one translucent
  material, described in `.claude/rules/ui.md`.
- **The tick numbers are the axis labels' own type**, Departure Mono on the third text
  tier, which is what makes an axis read as one thing rather than as a chart's numbers
  beside our words. Set through a class on the container, since `XAxis`'s `tick` prop
  takes SVG attributes and cannot name a font variable.
  **Its colours are resolved rather than named**: `--color-<key>` is scoped to the chart
  container by `ChartStyle`, and the legend is outside it, so `var(--color-webgl)` there
  resolves to nothing and the dots come out blank.
- **A pie's legend is a key, not a set of toggles**, and it is the only one. Switching a
  slice off changes what the whole is, so the figure would quietly answer a different
  question than its caption. A radar's profiles and a radial's gauges carry no such
  claim about each other, so both switch off like a cartesian series: hiding one of two
  overlaid shapes is how a reader isolates the other.
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

## ConfusionMatrix

**`components/figures/ConfusionMatrix` is finished but unlisted.** Registered in
`mdx-components.tsx`, absent from the design system: a figure waiting for the post that
needs it, not something the system should show off before one does. It is a heatmap and
a table at once. It is the form this data is read in everywhere it appears, so the
cells form a grid with a scale bar beside them; it is also tabular, so underneath it is
a real `table` whose counts stay selectable and whose cells a screen reader reads with
their row and column.

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

## Installing primitives

**`bunx shadcn@latest add chart` pulls `cn` from npm** and imports from it, where every
other primitive here takes `cn` from `@/lib/utils`. Repoint the import and remove the
package.
