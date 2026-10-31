---
paths:
  - "components/ui/**"
  - "components/Slider/**"
  - "components/Toggle/**"
  - "components/Card/**"
  - "components/Details/**"
  - "components/EmailInput/**"
  - "components/PasswordInput/**"
---

# Primitives and controls

Several shadcn files are customised beyond the CLI output. Update one with
`bunx shadcn@latest add <name> --diff` and re-apply its edits, never overwrite: they are
listed here for `badge`, `card`, `input`, `input-group` and `slider`, in
`.claude/rules/command-palette.md` for `command`, in `.claude/rules/tables.md` for
`table`, and in the `figure-chart` skill's reference for `chart`.

**`@base-ui/react` is a real dependency, used by exactly one component**:
`components/ui/combobox.tsx`, built on Base UI's combobox primitive: Radix ships none, so
shadcn's own combobox takes it even in the Radix style. Radix is the primitive layer for
everything else. Do not add Base UI components without a reason that specific. No page
mounts the combobox yet: its popup is still stock, so give it the Select's surface before
the first one does.

**`components/ui/badge.tsx` is customized beyond the CLI output**: the "Pill" family.
Sized for prose (`text-sm px-3 py-1 rounded-lg`) and carrying four tinted status variants
(`info` / `success` / `warning` / `danger`), each a ~10% wash of its colour. shadcn's stock
`destructive` is kept alongside `danger`.

**`components/ui/card.tsx` is intentionally customized** beyond the CLI output, like
`badge.tsx`. Three edits: the edge is a `border` resolving from `--border` rather than
`ring-1 ring-foreground/10`, so it matches every other inset surface; `size` defaults to
`sm`, since 16px is this site's rhythm; and `CardTitle` / `CardContent` carry the prose
type posts use.

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
Component. **The placeholder is load-bearing**: it is what separates empty from filled,
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
RadioGroup all pull `controlSurface` from `components/ui/control-surface.ts`, the whole
state machine, so it cannot drift three ways, and add only their shape and mark.

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
  end: widen further and a white knob pokes out past the pill's own edge.
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
  across that boundary: the callback version crashed the page.
- **The fill is ours, not `SliderPrimitive.Range`.** Radix drives Range's width from the
  value directly, which cannot be sprung; a `motion.div` on a spring can, so a click
  anywhere on the bar travels rather than jumps. Radix still owns the pointer, keyboard
  and ARIA; only the painting moved. `ui/slider.tsx` therefore requires its children:
  the fill is whatever the caller draws in the track.
- **The grip fades on collision, not on a percentage.** It hides where it would run into
  the label or the readout, so it stays visible *past* either of them: before the label
  at the bottom of the range, past the readout at the top. The threshold depends on how
  wide the caption happens to be, so it is measured through a `ResizeObserver`. A
  between-the-two test looks equivalent and is not: it blanks both extremes.
- **The grip is its own element, not the fill's `::after`.** At the bottom of the range
  the fill has no width to hang it off, and it has to stay pinned inside the bar rather
  than follow the fill's edge out of the track.
- **Springs must be under-damped to read as springs.** Damping ratio is
  `damping / (2 * sqrt(stiffness * mass))`; at or above 1 there is no overshoot at all
  and the motion is merely smooth. Stiffness is what makes an arrival abrupt, damping is
  what decides how far it rings past: reach for damping when something is too springy,
  or the arrival goes soft along with the rebound.
- **One spring runs for the life of the component and the fill chases it.** Nothing is
  triggered, staged or branched: setting the value only moves the mark, and a chase lags
  while its mark is moving then catches up once it stops. That single behaviour *is* the
  softness under a drag and the settle at the end of one. Several rounds were lost
  reaching for something more elaborate, a timed curve, keyframes, a release flourish,
  a spring picked per distance, and every one of them was rejected on feel. A timed
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
  changes: a transform reading `ref.current` keeps whatever it resolved to at mount,
  which is how the grip ended up parked at the far left.
- **Dragging past an end gives.** The overshoot has to be read from the pointer, because
  Radix has already clamped the value. The frame's rect is captured once at pointer
  down: it is being scaled by what we are about to set, so re-reading it would feed back
  into itself.
- **A step resists before it gives way.** The fill is dragged off its detent by a `tanh`
  pull, so it strains ahead of the value and springs across when Radix finally flips.
  `tanh` leaves the detent at slope 1 and only firms up near the limit: the bar tracks
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
  and read as texture, so the bar draws none: a continuous slider is stepped by 1 and
  would otherwise draw one per unit. They are filtered against the caption at measure
  time, like the grip, and the one the bar is resting on fades out, since the grip
  already marks that spot. Match it with a tolerance rather than an equality: both sides
  are a division reduced to a percentage, and thirds do not land on the same last digit.

**`components/ui/glass` is the material of panels over content**: the Dynamic
Island's own recipe, which the island, the tooltip, the legend and a code block's fold
button take. It is `--card/75` rather than a `--wash` step **because `--card` is defined
in both themes**: a single translucency cannot be right over a light page and a dark
one, and a panel that has to be read needs the surface under its text to follow the
theme rather than tint it. The 115% saturation is load-bearing, a plain blur greying
what it covers. `BeforeAfterSlider`'s handle deliberately keeps its own heavier fill,
floating over photography rather than over the page.

**Select is a raised surface, not an inset field.** Where `Input` is cut into the page,
the trigger sits *on* it, on `--wash/30`, the slider's own wash, and answers a hover by
lifting to `--wash-lift` (the same step in both themes) rather than taking an edge. The panel wears the same wash over
`backdrop-blur-md backdrop-saturate-[115%]`, so what it covers stays readable through it,
and its items are inset by `mx-1` so a highlight reads as a card lifting out of the list
rather than a band across it.
