import type { Visual } from '../types';

const NOISE = /* glsl */ `
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

export const halftone: Visual = {
  name: 'halftone',
  fragment: /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor;
uniform vec3 uBackground;

varying vec2 vUv;

${NOISE}

const float CELL = 27.0;
const float SCALE = 0.7;

void main() {
  // Square cells whatever the frame's shape.
  vec2 aspect = uResolution / min(uResolution.x, uResolution.y);
  vec2 grid = floor(uResolution / CELL);
  vec2 cell = floor(vUv * grid);
  vec2 within = fract(vUv * grid) - 0.5;

  // One octave: the shapes should read as broad drifts, not as texture, and it is
  // the only per-pixel cost worth counting here.
  vec2 p = (cell / grid) * aspect * SCALE;
  float field = snoise(p + vec2(uTime * 0.03, uTime * -0.02)) * 0.5 + 0.5;

  // The cell is a unit square, so a radius past 0.5 would touch its neighbours.
  float radius = (0.05 + 0.95 * smoothstep(0.02, 0.98, field)) * 0.52;
  // Blur, without blurring: a halftone going soft is its dots losing their edge
  // and their weight. Costs nothing, where a backdrop-filter over an animating
  // canvas costs a recomposite every frame.
  // The sharp region is bounded by a line climbing left to right; everything
  // below it softens with distance from that line.
  float below = (0.34 + 0.56 * vUv.x) - vUv.y;
  float soften = smoothstep(-0.04, 0.5, below);

  // One device pixel in cell space. Derivatives are an extension here, and the
  // cell size already says what a pixel is worth.
  float edge = (1.0 / CELL) * (1.0 + soften * 6.0);
  float ink = 1.0 - smoothstep(radius - edge, radius + edge, length(within));

  gl_FragColor = vec4(mix(uBackground, uColor, ink * field * (1.0 - soften * 0.35)), 1.0);
}
`,
};
