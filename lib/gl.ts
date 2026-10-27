// A full-frame fragment shader costs every pixel it is given, and past two the extra
// ones are not visible enough to pay for.
export const MAX_DPR = 2;

export const VERTEX = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;
