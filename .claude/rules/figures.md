---
paths:
  - "components/figures/**"
  - "components/ui/chart.tsx"
  - "app/_components/Home/Backdrop/**"
  - "lib/shader/**"
  - "lib/geometry/**"
  - "lib/fade.ts"
  - "hooks/use-playback.ts"
  - "test/figure.ts"
---

# Figures

Every change here, a one-line fix included, starts by loading two skills with the Skill
tool: `figure-design`, and the one for the kind of figure touched. Their rules are what
keep a fix from breaking the figure at another value of its control or in the other theme.

| Touching | Skill |
|---|---|
| A figure drawn in SVG, `Diagram`, `lib/vec*`, `lib/geometry/mesh`, `lib/geometry/rect`, `lib/geometry/polygon`, `test/figure.ts` | `figure-diagram` |
| `components/figures/Chart`, `ui/chart.tsx`, `ConfusionMatrix` | `figure-chart` |
| `components/figures/Shader`, `lib/shader/engine.ts`, `Backdrop`, and any figure rendering `<Shader>` (`LitWave`, `Halftone`, `VideoHalftone`: a folder with a `fragment.ts`) | `figure-shader` |
| `components/figures/Sandpack` | `figure-code` |

Finish with `figure-verify`.
