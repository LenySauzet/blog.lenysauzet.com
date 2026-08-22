/**
 * A decorative full-frame visual. It receives the clock, the canvas size and the
 * accent, and owns nothing else: the host holds the canvas, the loop and the cleanup.
 *
 * uniform float uTime;        seconds since mount
 * uniform vec2  uResolution;  canvas size in device pixels
 * uniform vec3  uColor;       the theme accent, from --base-hue
 *
 * Draw onto transparency: the canvas has none of its own, so the page shows through
 * wherever alpha does not. That is what keeps a visual from having to know the theme,
 * and what stops a stale background being baked into the frame when the theme flips.
 * Alpha is straight, not premultiplied, matching the renderer.
 *
 * GLSL ES 1.00: no `fwidth` or `dFdx`, which are an extension the browser does not
 * hand out here. Derive edge widths from the geometry instead.
 */
export interface Visual {
  name: string;
  fragment: string;
}
