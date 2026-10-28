# Colour in a figure

## The ink and its companions

- **A figure is drawn in one ink, and the ink is the accent.** The structure takes
  `ink`, which is `--primary`, so every figure carries the colour the reader chose, the
  way Making Software draws everything in its own cobalt. Beside it sit two companions,
  `second` and `third`, **picked per preset in `lib/hues.ts`**: out of orange, emerald,
  violet, rose and sky, each is the one furthest round the wheel from the accent and
  from the companion before it, as Tailwind's 600 in light and 400 in dark. A fixed hue
  fails because with seventeen presets it is somebody's accent; a plain complement
  fails because it lands in the yellows for a blue, and a yellow at the accent's
  lightness is mustard. `hues.test.ts` holds all three 70 degrees apart and every
  companion over 3:1 in both themes.
- **A companion is for something the reader is told apart by colour**, such as the
  passes of de Casteljau's construction. Rank within one thing is the ink's job, carried
  by weight and dash: the curve drawn so far is thick, the rest of it dashed. Two
  companions is the ceiling; past that a colour is no longer remembered, and naming is
  the leader's job. A hue that names something in the world (a pixel's R, G and B) is fixed,
  and is declared the day a figure needs one. A fill is the tone mixed toward the page,
  so one definition lightens on a light page and darkens on a dark one.
- **`guide` is not `--border`.** A border is the edge of a surface and measures 1.23
  against the page, which is a line nobody can follow. The construction lines take a
  mix of `--muted-foreground`, 2.20 in light and 3.16 in dark, which is where the
  reference's own `#ACB5CA` lands.
