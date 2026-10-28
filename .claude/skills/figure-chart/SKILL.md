---
name: figure-chart
description: >-
  Builds and changes charts, graphs and data figures with components/Chart on Recharts
  (area, bar and line over axes, PieChart, RadarChart, RadialChart) and the
  ConfusionMatrix heatmap. Use whenever a post shows measured or computed values
  (timings, benchmarks, distributions, proportions, profiles, counts), even when the
  user just says 'a graph' or gives the numbers inline, and for any change to
  components/Chart, components/ui/chart.tsx or ConfusionMatrix.
---

# Charts

Data goes through the chart components as props; a post never touches Recharts. Load
`figure-design` first; what Recharts forces, measured, is in [reference.md](reference.md).

## Choosing the component

| The data | Component | Key props |
|---|---|---|
| Series over an axis | `Chart` | `data`, `series`, `x`, `y`, `type` (`area`, `bar`, `line`), `fill` |
| Parts of one whole | `PieChart` | `data` of slices, `donut` |
| Profiles over the same spokes | `RadarChart` | `data`, `series`, `axis` |
| Gauges against one full turn | `RadialChart` | `data` of slices, `max` |
| Counts across two categories | `ConfusionMatrix` | `matrix`, `labels`, `rowLabel`, `columnLabel` |

Types are in `components/Chart/types.ts`, and every chart is shown in the design system
through `components/ComponentShowcase/ChartShowcase.tsx`, with data a post can copy.
`Chart`, `PieChart` and `ConfusionMatrix` are registered in `mdx-components.tsx`;
register `RadarChart` or `RadialChart` there before a post uses one.

## Rules that decide the figure

- **Areas overlay, never stack**, and curves stay `monotone`: stacking and smoothing past
  a reading are claims about the data these figures do not make.
- **Colours come from the five chart tokens**, shades of the accent. A series names its
  own colour only when the colour is the subject.
- **A pie's legend is a key, not a toggle**: hiding a slice changes the whole. Cartesian,
  radar and radial series can be switched off, never the last one.
- **A decoration goes inside the plot**, as a child of `Chart`, which hands it the
  chart's own scales (`useXAxisScale`, `usePlotArea`), so it lines up by construction.
- **Axis labels and the legend are ours**, in the figure's type; the legend sits above
  the plot as the key to what follows.
- **Data the reader looks up rather than compares is a table**, not a chart.

## A new kind of chart

A kind with no axes gets its own component beside `Pie.tsx` and `Polar.tsx`, sharing the
frame, the legend, the tooltip and `series.ts`, rather than a new value of `type`. Its
logic goes in `series.ts` or a pure module with its own test. When shadcn regenerates
`ui/chart.tsx` or `ui/table.tsx`, re-apply the customisations listed in this skill's
reference and in `.claude/rules/tables.md`.

Finish with `figure-verify`: a chart is checked as it enters (drawn when scrolled to),
across a series toggle, and in both themes.
