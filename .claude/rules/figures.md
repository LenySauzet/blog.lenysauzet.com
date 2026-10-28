---
paths:
  - "components/Figure/**"
  - "components/figures/**"
  - "components/Chart/**"
  - "components/ui/chart.tsx"
  - "components/Shader/**"
  - "components/Backdrop/**"
  - "components/Sandpack/**"
  - "lib/shader.ts"
  - "lib/vec2.ts"
  - "lib/vec3.ts"
  - "lib/mesh.ts"
  - "lib/rect.ts"
  - "lib/polygon.ts"
  - "lib/clock.ts"
  - "lib/css-color.ts"
  - "hooks/use-playback.ts"
  - "test/figure.ts"
---

# Figures

Every change here, a one-line fix included, starts by loading two skills with the Skill
tool: `figure-design`, and the one for the kind of figure touched. Their rules are what
keep a fix from breaking the figure at another value of its control or in the other theme.

| Touching | Skill |
|---|---|
| A figure drawn in SVG, `Diagram`, `lib/vec*`, `lib/mesh`, `lib/rect`, `lib/polygon`, `test/figure.ts` | `figure-diagram` |
| `components/Chart`, `ui/chart.tsx`, `ConfusionMatrix` | `figure-chart` |
| `components/Shader`, `lib/shader.ts`, `Backdrop`, and any figure rendering `<Shader>` (`LitWave`, `Halftone`, `VideoHalftone`: a folder with a `fragment.ts`) | `figure-shader` |
| `components/Sandpack` | `figure-code` |

Finish with `figure-verify`.
