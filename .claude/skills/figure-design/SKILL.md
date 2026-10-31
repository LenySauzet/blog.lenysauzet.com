---
name: figure-design
description: >-
  The visual language every figure on this blog shares, drawn from Making Software and
  Maxime Heckel: one ink in the reader's accent, line weight and dash as meaning,
  Departure Mono names, one idea per figure, scaling without scrolling, motion that
  pauses, both themes. Use when designing, building, fixing or reviewing any figure,
  chart, diagram or shader, and whenever a figure's colours, lines, labels, layout or
  motion look wrong.
---

# Figure design

This skill sets how a figure looks; the skill for its kind says how it is built, and
both are needed: `figure-diagram` (SVG), `figure-chart` (data), `figure-shader` (per
pixel), `figure-code` (live code). Load that one too if it is not loaded yet.

Every rule here is a default with a reason. Break one when the figure's idea needs it,
say why in the PR, and if the reason generalises, change this file rather than the one
figure. A rule that only reflects what the toolbox cannot do yet is not a rule: extend
the toolbox.

## What the references get right

Making Software draws nearly everything in one hue at a few lightness steps, lines
first, flat fills, no shadows. Line style carries state: solid and heavy is the result,
solid and thin the structure, dashed the hidden, the construction or the not-yet. Labels
are typography rather than annotation, small uppercase mono in a margin, reaching their
subject by a straight hairline. One idea per figure, generous air, a figure that scales
and never scrolls. Maxime Heckel adds interaction bound to one control, the maths
computed live, and a figure the reader learns from by pushing it to its limits.

## The frame

- **`components/Figure` is the frame**: block rhythm and a caption, and it never knows
  what it contains. A visual that needs more than that is a component inside it.
- **A figure draws no surface.** It sits in the prose, not in a card that fences it off
  from the paragraph introducing it. Only content that runs to its own bounds, a canvas,
  draws its own edge. `Playground` is the exception that proves it: controls and canvas
  are two panels because they are two things.
- **It scales and never scrolls.** Drawn figures work at `MEASURE`, the prose width,
  and raise their type through `@container` steps as the column narrows, so a name never
  falls far under 10px down to 336px. Nothing is a fixed pixel size a phone has to scroll.
- **The caption is one line** on what to look at. The figure's own name, if any, is a
  `Title` inside it.

## Colour

- **One ink, and it is the reader's accent.** Structure takes `ink` (`--primary`), so a
  figure carries the colour the reader chose.
- **Two companions at most**, `second` and `third`, for things the reader must tell
  apart by colour, and only then. Rank within one thing is weight and dash, never hue.
  Charts are the exception in kind, not in spirit: their series take the five chart
  tokens, shades of the same accent (see `figure-chart`).
- **A hue that names something in the world is fixed**: R, G and B, a wavelength, a
  named colour. A curve labelled Green drawn in the accent is absurd.
- **Construction lines are `guide`, never `--border`**, which nobody can follow.
- **A fill is the tone mixed toward the page**, so one definition works in both themes.
- **Highlights are `--figure-shine`, never white**, which vanishes on the light page. A
  mark drawn into a picture (a halftone's dot) is part of that picture and keeps its
  own colour.
- **Tokens only, both themes.** A literal colour is a bug unless it names something in
  the world. Draw onto transparency so a theme flip repaints the ink and nothing else;
  a picture is the exception, opaque on its own ground, the same in both themes.

How the companions are chosen and measured: [color.md](color.md).

## Line

- **Weight says rank**: the result heaviest, the structure thin, the mesh lighter
  (`ink-soft`), the silhouette one step heavier than the mesh.
- **Dash says status**: hidden, constructed, or not reached yet.
- **Hatching is a cut**, for a section or the part a figure singles out, never texture.
- **A grid is tiles separated by the page**, never rules drawn over fills.

## Type and names

- **Departure Mono for every name, number and title.** `Title` is uppercase and tracked,
  the way Making Software names a panel ("625 VERTICES").
- **Names never collide**, with each other, with a point, or with a line they could
  hide, at any value of the control and at every type step. This is tested, not eyed.
- **A name sits beside its subject or goes to the margin on a `Leader`**, level then one
  turn, ordered so no two leaders cross. A region is named beside itself, on the side
  nothing sweeps across, never by a leader that something could cross.
- **A name wears a halo in `--background`**, so a stroke under it is knocked out.
- **Numbers that change keep their width**: fixed decimals, anchored at their end.
- **Eight names is a lot.** Past that, the figure is two figures.

## Composition

- **One idea, centred, with air.** A comparison is two panels side by side, each named.
- **Projection follows the subject**: orthographic for maths, isometric for physical
  things and stacks, flows left to right.
- **Scale changes through a lens**: `Magnifier` for the same scene closer, `Detail` for
  a deeper view drawn for the purpose.
- **A drawn figure's edges dissolve** into the page rather than stopping at a border;
  a canvas, whose content runs to its bounds, draws its own edge instead.

## Interaction and motion

- **The controls are the parameters the text discusses**: one, usually, or a
  `Playground` of the uniforms a shader's text walks through. The default shows the
  idea at rest; every control's whole range must hold up, which is where every past
  defect was.
- **Controls are the site's**: `Slider`, `Toggle`, and `Playback` for time.
- **Motion has a reason**: a process that unfolds, a shader that lives in time. It runs
  only on screen, stops for a reader who asked for less motion, and anything moving on
  its own past five seconds can be paused (WCAG 2.2.2).

## Accessibility

- **A drawn figure or a shader is one image to a screen reader**: `role="img"` and a
  label saying what the picture shows; when it fails (no WebGL, a missing image) the
  label says so. A figure that is data stays readable as data: `ConfusionMatrix` is a
  real table read cell by cell, and a chart keeps its legend and tooltip as text.
- **Every control is reachable and named** by keyboard, with the site's focus ring.
