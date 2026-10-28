---
name: figure-verify
description: >-
  Proves a figure, chart, shader or sandbox on this blog is right before it ships, in
  order: pure tests swept across every control, tests proved by breaking the code, the
  figure inspected in a real browser in both themes, two accents, phone and desktop
  widths and reduced motion, the repo's gate, an independent review, then the user's
  approval. Use after building or changing any figure, and before calling one done or
  opening its PR.
---

# Verifying a figure

Done means each step below has run and its output was read. Report what failed, with the
output, as plainly as what passed; a step that was skipped is named as skipped.

## 1. Tests that state the figure's rules

- **Pure logic carries the weight.** Geometry, settings, framing: `geometry.test.ts`
  beside the code. jsdom has no layout and no WebGL, so a component test only shows the
  figure stands (one named `img`, its controls), with `@/lib/shader` mocked for shaders.
- **Sweep, never sample.** Iterate each control over its whole range in fine steps and,
  for a drawn figure, at each size in `SIZES` from `test/figure.ts`. Nearly every past
  defect lived at one angle out of a hundred, or at an extreme.
- **Prove each test.** Break the code it guards (delete the line, flip the condition,
  swap the value) and watch it fail; then restore. A test that survives its own
  mutation is rewritten or removed. Script the mutations when there are several, and
  assert each one actually matched before trusting its result.

## 2. The browser

`bun dev` may already be serving port 3000; leave it running. For a production check,
`bun run build && bun start -p 3123`.

Run [scripts/inspect-figure.js](scripts/inspect-figure.js) through Playwright MCP's
`browser_run_code_unsafe`: read it, set `FIGURE` (the page, how to find the figure,
what to click first if anything, an output folder), pass it whole. It returns console errors, each state's
label, sideways scroll and overlapping names, and every overlap met while sweeping each
slider, and saves a screenshot per state: light and dark, two accents, 375 and 1280
wide, with and without reduced motion. Then **look at every screenshot**: a passing
script says nothing about whether the figure is good.

Beyond the script, as the figure needs:

- **Against its reference**: screenshot ours beside the reference figure and compare
  detail by detail (corners, fill, dash, type placement, motion) before calling it done.
- **Motion**: sample from inside the page through `requestAnimationFrame`, never by
  polling over the wire, which steps over peaks. Check it pauses, and stops off screen.
- **Colour and contrast**: paint a computed colour into a 1x1 canvas and read the
  pixel. `getComputedStyle` hands back `oklab()` or `lab()` for a `color-mix`, and a
  parser expecting three RGB numbers invents failures.
- **Media**: a CDN asset must answer a GET carrying an `Origin` header with 200 or 206
  and `access-control-allow-origin`. A `HEAD` reads `DYNAMIC` from the cache whatever it
  holds. A replaced file gets a new name.
- **Performance**: a shader is measured at DPR 2 on the real machine, and anything heavy
  is flagged for a phone rather than assumed fine. A browser that holds 30fps with the
  figure off screen cannot measure it.

## 3. The gate

```bash
bun lint && bun run type-check && bun run test && bun run build
```

Read the build log: a missing image warns rather than fails.

## 4. Review, then approval

- **An independent review** of the diff by a subagent given the code, the repo's bar
  (no dead code, no smell, minimal comments, tests that fail without their behaviour)
  and the files to read, never your conclusions. Act on what is real; answer the rest.
- **The PR** says what was checked and what was not, including what only a real phone
  can show.
- **Never merge without the user's explicit approval of that PR.**
