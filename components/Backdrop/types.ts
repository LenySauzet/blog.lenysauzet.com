/**
 * A decorative full-frame visual. It receives the clock, the canvas size and the
 * theme, and owns nothing else: the host holds the canvas, the loop and the cleanup.
 *
 * uniform float uTime;        seconds since mount
 * uniform vec2  uResolution;  canvas size in device pixels
 * uniform vec3  uColor;       the theme accent, from --base-hue
 * uniform vec3  uBackground;  the page behind it
 *
 * GLSL ES 1.00: no `fwidth` or `dFdx`, which are an extension the browser does not
 * hand out here. Derive edge widths from the geometry instead.
 */
export interface Visual {
  name: string;
  fragment: string;
}
