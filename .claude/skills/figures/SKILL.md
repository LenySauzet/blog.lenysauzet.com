---
name: figures
description: >-
  Decides whether a passage of a blog post deserves a figure, which kind, and briefs
  it before anything is built. Use before adding anything visual to a post (a chart or
  graph, a diagram, an illustration, an interactive demo or slider, an animation, a
  shader, live code), when writing, outlining or reviewing a post in content/, and
  when choosing between those kinds or no figure at all.
---

# Figures

A figure earns its place by showing one idea faster than prose can. Most paragraphs need
none, and "no figure" is a complete answer. This skill decides and briefs; the kind's own
skill builds, `figure-design` sets how it looks, `figure-verify` proves it.

## 1. Does this passage need one?

Ask in order and stop at the first no.

1. **What is the one idea?** Write it as a sentence. Two ideas are two figures, or none.
2. **Does an eye read it faster than a sentence?** Geometry, a distribution, stages of a
   process, how a parameter changes an output, a rendered effect: yes. A list, a
   definition, three numbers: no, write them.
3. **Would moving something make it click?** Then it is interactive, and the control is
   the parameter the text is about. If no single control does that, it is still.
4. **Is this the moment?** A figure interrupts reading. It goes right after the sentence
   that raises the question it answers, never as a break between sections.

Signs it is decoration: it restates the paragraph, it exists to "break up text", it
needs its caption to say what it is, or its control changes nothing the text discusses.

## 2. Which kind

| The idea is | Kind | Built with |
|---|---|---|
| Values on a scale: series, distribution, measured comparison | Chart | `figure-chart` |
| Parts of a whole, a profile, a gauge | `PieChart`, `RadarChart`, `RadialChart` | `figure-chart` |
| Counts across two categories | `ConfusionMatrix` | `figure-chart` |
| Values a reader looks up | A GFM pipe table, not a figure | `.claude/rules/tables.md` |
| Geometry, a construction, a mechanism computed from maths | Drawn figure, SVG | `figure-diagram` |
| A surface or object in 3D, read as lines | Drawn figure on `lib/vec3` | `figure-diagram` |
| A system: stages, where they run, what flows | `Box`, `Frame`, `Arrow` | `figure-diagram` |
| A process unfolding in time | Drawn figure on `useTimeline` | `figure-diagram` |
| Anything per pixel: light, noise, a filter, an image or video processed | `Shader` | `figure-shader` |
| The code itself, edited and run by the reader | `Sandpack` | `figure-code` |
| A photograph, a screenshot, a before and after | `Image`, `BeforeAfterImage`, `VideoPlayer` | `.claude/rules/content.md` |

When two kinds fit, take the one whose control is the idea: a shader that only shows a
curve is a chart, a chart of something spatial is a diagram.

**This blog's figures are the worked examples.** Read the nearest before designing:
`RaySphere` (a construction under one control, names in the margin), `Bezier` (passes
told apart by colour), `Coverage` (a pixel grid, a magnifier), `Wave` (3D as lines),
`Lerp` (a system driven by time), `LitWave` (a marched surface, lit), `Halftone` and
`VideoHalftone` (an image and a video processed), and the charts in
`components/ComponentShowcase/ChartShowcase.tsx`. The reference blogs are Making Software
(makingsoftware.com) for drawing and Maxime Heckel (blog.maximeheckel.com, whose source
may be checked out beside this repo as `../blog.maximeheckel.com`) for interaction.

## 3. When nothing fits

The toolbox is what posts have needed so far, not what they are allowed. Never bend an
idea into the wrong kind to avoid building the right one.

- **A missing part** (a mark, a projection, a control): add it to that kind's toolbox,
  tested, then use it. Each kind's skill says how.
- **A missing kind**: bring the user the idea it serves, what it costs (bundle, build
  time), and the nearest existing kind. The first post that needs it builds it and writes
  its skill. Two are known and deliberately not built yet:
  - **A 3D scene** with perspective, meshes or physics: React Three Fiber, installing
    `three` (about 150KB) with that post and not before. When the code is the subject,
    it goes in a `Sandpack` instead.
  - **A free illustration** of a physical object (isometric hardware, an exploded view):
    drawn in Figma with the accent ramp as variables, exported to SVG, colours rebound
    to tokens and text restored as real `<text>` in Departure Mono.

## 4. The brief

Write it before building and show it to the user, whose article it is:

- **Idea**: the one sentence.
- **Place**: the sentence it follows.
- **Kind**: and the skill that builds it.
- **Control**: the parameter, its range and default; or still; or time, pausable. The
  default must already show the idea, for a reader who never touches it.
- **Caption**: one line on what to look at, never what the figure is.
- **Label**: what a screen reader hears instead of the picture.
- **Reads like**: the existing or reference figure it should resemble, if one does.

Then load `figure-design`, build with the kind's skill, and finish with `figure-verify`.
A figure only enters `content/design-system.mdx` when the user asks for it.
