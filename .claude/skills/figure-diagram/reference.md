# Drawn figures: what the toolbox forces

Contents: [Why SVG](#why-svg), [Layout and names](#layout-and-names), [The toolbox](#the-toolbox), [Systems and time](#systems-and-time), [Three dimensions](#three-dimensions), [Server and browser agree](#server-and-browser-agree).

## Why SVG

**A geometric figure is drawn in SVG, from maths a test can read.**
`components/figures/Diagram` is the plane and its marks; `lib/vec2.ts` is the plane
maths; the figure's own geometry sits beside it, pure, the way `rail.ts` sits beside
the reading rail. `RaySphere` is the first and the shape the next ones copy.

**SVG rather than a canvas**, which is what Maxime Heckel draws these on. Ten marks
redrawn on a slider need no raster, and the trade is all one way: the colours become
tokens, the labels stay selectable, and the whole is one `role="img"` with a title
rather than a surface a screen reader cannot enter.

## Layout and names

- **The frame is cut to hold the drawing across the whole control, not at rest.** Every
  defect in `RaySphere` came from that: two names colliding at one angle out of a
  hundred, a label outside the frame at the extremes, another inside the edge fade at
  all of them. **Sweep the control in the geometry's own test**, at each of the three
  type sizes: every name is boxed at every step and must never overlap another, never
  sit on a point, never meet a line it could hide and never reach the fade.
  `test/figure.ts` holds the boxes and the checks, so a figure's test states only
  its own rules.
- **Names are pushed apart from each other, never to fixed sides.** Two points already
  separated along one axis come back together at whatever angle leaves them twice the
  offset apart.
- **A name that cannot sit beside its subject goes to the margin, on a `Leader`.** The
  names stack in a column through `stack` in `Diagram/leaders.ts`, ordered by their
  targets so no two leaders cross, pushed apart by a pitch sized for `LARGEST_TYPE`
  because the type is CSS's to choose and the layout is not, and a leader runs level
  then turns once, just short of what it names. Leaders are drawn first, under the
  construction they point into.
- **A region is named beside itself, never by a leader.** Both circles lie wholly
  inside the ray's sweep, so any line pointing at them is crossed at some angle. The
  name sits on the far side of the centre from the ray, which can then never reach it.
- **A name wears a halo in `--background`**, through `paint-order`, so a stroke passing
  under it is knocked out rather than read through. A point on a circle is named
  across that circle's edge at some angle, and no placement avoids it.
- **A figure scales and never scrolls, and its type does not shrink with it.** Every
  diagram is drawn at `MEASURE`, the prose width, so one set of `@container` steps can
  raise the type in the drawing's own units as the column narrows: 13, 16, then 20,
  which never lets a name fall far under 10px down to 336. A name sits off its point by an offset in
  `em`, so the gap grows with the type it separates. A fixed width is what lets the
  steps be shared: a container query cannot read a figure's own viewBox.
- **The edges dissolve** through `ScrollFade`'s ramp, four of them intersected rather
  than one radial, which pulls the corners in on a wide drawing, and the band is narrow
  enough to catch a line leaving and nothing named.

## The toolbox

- **A figure is assembled from the toolbox, never drawn inline.** `components/figures/
  Diagram` holds the atoms (`Point`, `Line`, `Curve`, `Arrow`, `Polygon`, `Circle`,
  `Rectangle`, `Label`, `Title`, `Readout`), the parts built from them (`Leader`,
  `Magnifier`, `Detail`, `Surface`, `Box`, `Frame`) and
  the pure geometry each one rests on. A figure is its subject, its controls and a
  composition of those; when it needs a way of drawing the toolbox lacks, the way is
  added there, tested, and the figure uses it. One change then reaches every figure.
- **Tones are CSS values in one map, applied as two variables.** `tones.ts` maps each
  tone to a value and `paint()` sets `--fill` and `--edge` on the element, so the
  classes stay `fill-(--fill)` and `stroke-(--edge)` whatever the tone. A tone as a
  class could not give one element two tones, which cost every face of a surface a
  second polygon: 2670 elements and 25ms a step, against 1518 and 16.9 once a shape
  could take an `outline` of its own.
- **Every shape takes one stroke and one fill.** Tone, width and dash are shared by
  `Circle`, `Polygon`, `Line`, `Curve` and `Arrow`; a fill is `none`, `soft`, `solid`,
  `hatched`, or a number for the tone at that share, and `outline` gives the edge a
  tone of its own. `width={0}` leaves the fill alone.
- **Parts that differ in kind differ in weight or tone.** A vertex is full ink, a mesh
  line `ink-soft`, the silhouette full ink and heavier, a construction line `guide`.
  Drawn in one ink at one weight, a mesh is a single texture and nothing in it reads.
- **`Title` is the figure's own lettering**: uppercase Departure Mono, tracked, the
  way Making Software names a panel or a count ("625 VERTICES"). A number in it is
  formatted with a fixed locale, never the runtime's, or the server and the browser
  write it differently.
- **`Readout` is anchored at its end**, so a value whose width changes grows into the
  figure rather than off it, and writes a fixed number of places so it does not
  shimmer as it counts.
- **Hatching is the drawing-office mark for a cut**, so `hatched` is for a section or
  for the part of something a figure singles out, never for decoration. Its pattern
  takes an id from `useId`, so every copy of a drawing gets its own.
- **A lens is one frame with two uses.** `Magnifier` redraws the scene it is handed,
  scaled about the source by the ratio of the two circles, which is what a loupe's
  power is, so the detail follows any control the figure has. `Detail` shows something
  drawn for the purpose around its own centre, the deeper view a cross-section opens
  onto. Strokes keep their width at any zoom through the plane's non-scaling stroke,
  which keeps a magnified grid crisp; type would grow, so a magnifier is handed the
  drawing without its names. The two lines are the circles' external tangents, in
  `magnifier.ts`.
- **A grid of cells is tiles, never lines over fills.** Cells are separated by a gap
  in `--background` and an empty cell keeps a faint tint of the ink. Grey rules laid
  over coloured cells darken the whole grid in light, where the fills are pale.

## Systems and time

- **A system diagram is boxes in frames**, drawn the way Making Software draws them.
  A `Box` is a stage, a solid edge around its name; a `Frame` groups the stages that
  run in one place, dashed. Both are square. A frame is filled with `well`, the page
  pulled a few percent toward the text, so it reads as a slightly darker ground in
  light and a slightly lighter one in dark; a box is the page, so it stands out of the
  frame it sits in. A frame's dashes are cut square (`butt`) and
  thinner than a line's, or the round caps close the gaps. Its title sits outside,
  above the top edge, from the left corner or over the middle, one `em` up so the gap
  follows the type.
- **A figure driven by time is a figure whose parameter comes from `useTimeline`**
  rather than from a slider, so its geometry stays a pure function of one number. It
  runs only on screen, a step capped by `lib/clock.ts` so a tab coming back does not
  leap. Whether it plays is `hooks/use-playback.ts`, shared with every shader and
  `Backdrop`: still for a reader who asked for less motion, and a figure is pausable
  through `Playback`, since anything moving on its own past five seconds must be (WCAG
  2.2.2). `Backdrop` has no such control yet.

## Three dimensions

- **Three dimensions stay in SVG while the subject is lines.** `lib/vec3.ts` holds an
  orthographic camera, yaw, pitch and scale, of which `ISOMETRIC` is one setting;
  `lib/mesh.ts` builds a heightfield, its faces and its silhouette. Perspective waits
  for the figure that needs it, and a phenomenon that lives per pixel, lighting
  included, is a canvas's.
- **A silhouette is an edge between a face turned to the eye and one turned away, and
  the border**, drawn one weight heavier than the mesh: it is the line that detaches a
  form from its ground. Faces and edges are sorted together, back to front, so a fold
  behind a crest is covered by it rather than drawn across it.
- **A face is the page, not the ink.** `Surface` fills faces with `page` at
  `occlusion`, so whatever lies behind a surface, its far side and the axes alike,
  fades rather than takes a tint: 0.8 ghosts the back, 1 removes it, which is
  hidden-line removal by the painter's algorithm alone. An axis runs out both ways,
  an arrow at each end, named at its positive one.
- **A grid's cells are square, and fine enough for the highest frequency.** Nineteen
  points a side aliased the wave into a zigzag; twenty-five keep eight cells to a
  period. Forty-one columns over eleven rows was smoother and cheaper, and read as a
  ruled sheet rather than a mesh, which is the subject. `heightfield` still takes
  columns and rows apart for a surface that wants them.
- **Everything that lives in the scene is painted in its order**: faces, silhouette,
  vertices, and the axes cut into short segments, so an axis passing under the
  surface is tinted by the faces in front of it. Only the names sit on top.
- **A mark sits over the faces it belongs to, and under the ones in front of it.** A
  face strokes its own edges, so a neighbour a hair nearer would paint its edges across
  the vertex and the silhouette they share. Both are offset toward the eye by the depth
  one cell spans, the way a GPU offsets polygons: a silhouette by one cell from its
  nearer end, a vertex by two, which clears every face and silhouette meeting at it
  while a fold genuinely in front still fades it. The tests pin both halves.
- **Keep a turn well short of edge-on.** Within about twenty degrees of looking along
  the crests, faces flip between facing and not from one to the next and the
  silhouette breaks into ticks.

## Server and browser agree

- **A figure is rendered twice, by Node and by the browser, and their floats differ.**
  `Math.sin` and `Math.cos` disagree in the last digits between the two, which hydration
  reports as a mismatch on every attribute they reach. The primitives therefore write
  every coordinate at two decimals and every opacity at three, a hundredth of a unit
  being invisible, and a depth sort compares each depth rounded on its own, then the
  ids by code unit. Rounding the difference instead is not transitive (0, 0.4e-6 and
  0.8e-6 tie pairwise and not end to end), and `localeCompare` follows the runtime's
  locale; either lets the two sorts part. Reproduced at three mismatches in three loads of the
  design system, none once rounded.
- **Every piece carries a stable id and is keyed by it.** The list is re-sorted on
  every step, so an index key hands one position to a different piece, and a polygon
  turning into a circle there is a remount. Keyed, React moves nodes instead: the p90
  per slider step fell from 21.8ms to 17.4 when it landed. The scene and its keys
  live in `Diagram/scene.ts`, so every surface inherits both.
