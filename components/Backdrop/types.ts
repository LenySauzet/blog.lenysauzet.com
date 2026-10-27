/**
 * A decorative full-frame visual, in GLSL ES 3.00. It receives the clock, the canvas
 * size and the accent, and owns nothing else: `Shader` holds the canvas and the loop.
 *
 * uniform float uTime;        seconds of play, held while still
 * uniform vec2  uResolution;  canvas size in device pixels
 * uniform vec3  uColor;       the theme accent, from --base-hue
 *
 * Draw onto transparency: the canvas has none of its own, so the page shows through
 * wherever alpha does not. That is what keeps a visual from having to know the theme,
 * and what stops a stale background being baked into the frame when the theme flips.
 * Alpha is straight, not premultiplied, matching the renderer.
 */
export interface Visual {
  fragment: string;
}
