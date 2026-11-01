/**
 * The glass of panels read over the page: the Dynamic Island's own material,
 * which is where it was first settled. A wash of `--card` over a blurred, slightly saturated
 * backdrop, edged in a hairline. It is what lets a panel sit *over* content
 * and stay readable, where `Card` and `Input` are cut *into* the page.
 *
 * `--card` rather than `--wash` because it is defined in both themes: a single
 * value cannot be the right translucency over a light page and a dark one, and
 * a panel that has to be read needs the surface under its text to follow the
 * theme rather than tint it.
 *
 * The saturation matters as much as the blur: a plain blur greys whatever it
 * covers, and 115% puts the colour back, so the surface reads as glass rather
 * than as fog.
 *
 * Radius is the caller's, a pill, a tooltip and a dropdown not rounding alike.
 */
export const glassSurface =
  'border border-border/60 bg-card/75 backdrop-blur-[6px] backdrop-saturate-[115%]';

/**
 * Glass over imagery: controls floating on a photograph or a video, where the
 * picture should show through rather than be veiled. The same in both themes, since
 * it sits on the picture rather than the page: `--media-glass` at 30% under a rim lit
 * from above (`glass-rim`), inked in `--media-ink`, which is also what its marks are
 * drawn in. The caller positions it, since the rim hangs off its box.
 */
export const mediaGlass =
  'glass-rim bg-media-glass/30 text-media-ink backdrop-blur-md backdrop-saturate-[115%]';
