---
name: figure-diagram
description: >-
  Builds, fixes and restyles drawn figures in components/figures: SVG geometry and
  constructions, 3D surfaces as lines, system diagrams of boxes and frames, and
  figures animated in time, all composed from the Diagram toolbox over pure, tested
  geometry. Use for any work on such a figure, a small fix included (overlapping
  labels, a range, a colour, a new control), and whenever a post needs a construction,
  a mechanism, a 3D surface, stages of a system or a process unfolding in time drawn
  rather than plotted.
---

# Drawn figures

A drawn figure is SVG composed from the `components/figures/Diagram` toolbox over
geometry that is a pure function of its control. Load `figure-design` first; the
measured reasons behind every rule below are in [reference.md](reference.md).

## Anatomy

```
components/figures/Name/
├── Name.tsx            the component: state, controls, composition, nothing computed
├── geometry.ts         pure: control value in, every point, path and name placement out
├── geometry.test.ts    the maths, then the names swept across the whole control
├── Name.test.tsx       it stands: one named image, its controls
└── index.ts            export { default } from './Name';
```

A subject with its own maths (`ray-circle.ts`, `de-casteljau.ts`) gets its own pure
module and test beside `geometry.ts`. Register the figure in `mdx-components.tsx`.

## The toolbox

- **Plane**: `Diagram` (the `MEASURE`-wide SVG, its type steps and fading edges),
  `lib/vec2.ts`, `lib/rect.ts`, `lib/polygon.ts`. A scale is a subtraction and a multiply;
  reach for `d3-scale` when the mapping stops being linear, not before.
- **Atoms**: `Point`, `Line`, `Curve`, `Arrow`, `Polygon`, `Circle`, `Rectangle`,
  `Label`, `Title`, `Readout`. Every shape takes one tone, width, dash and fill
  (`none`, `soft`, `solid`, `hatched`, or a share), and `outline` for an edge of its own.
- **Parts**: `Leader` and `stack` for names in the margin, `Magnifier` and `Detail` for
  lenses, `Surface` for a heightfield, `Box` and `Frame` for systems.
- **Space**: `lib/vec3.ts` (orthographic camera, `ISOMETRIC`), `lib/mesh.ts`
  (heightfield, faces, silhouette), `scene` and `paintOrder` for depth.
- **Time**: `useTimeline` for the parameter, `Playback` for the pause, `use-playback`.
- **Tones**: `tones.ts`, applied through `paint()` as `--fill` and `--edge`.

Copy the nearest figure rather than starting blank: `RaySphere` for a construction under
one control with leaders, `Bezier` for companions and passes, `Coverage` for a grid and a
magnifier, `Wave` for 3D, `Lerp` for a system in time.

## Building one

1. **Geometry first, in TypeScript.** Everything the figure draws is computed in
   `geometry.ts` from the control value: positions, paths, which names show and where.
   The component only maps that onto atoms.
2. **Sweep it in the test** before looking at it. Use `test/figure.ts`: box every name
   with `textBox` at each size in `SIZES`, across the whole control in fine steps, and
   assert no `overlap`, no name `covers` a point, none `crossesLine` it could hide, all
   `clearOfFade`. State the figure's own rules beside those.
3. **Compose** from the toolbox. A way of drawing it lacks is added to the toolbox
   (`primitives.tsx` or a pure module beside it), with its own test, and then used.
   Never draw raw SVG inside a figure.
4. **Verify** with `figure-verify`.

## What bites

- **Server and browser must write the same numbers**: the primitives round coordinates
  to two decimals and opacities to three, and depth sorts compare rounded depths then
  ids by code unit. Never format with the runtime's locale.
- **Every piece in a re-sorted scene is keyed by a stable id**, never by index.
- **3D stays in SVG while the subject is lines.** Lighting, or anything per pixel, is a
  shader. Keep a turn well short of edge-on.
- **A frame holds the drawing across the whole control**, not at rest. Size it from the
  sweep.
