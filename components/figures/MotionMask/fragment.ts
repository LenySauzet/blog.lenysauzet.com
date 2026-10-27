import { COVER, LUMA } from '@/components/Shader/glsl';

const INPUTS = /* glsl */ `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform sampler2D uVideo;
uniform vec2 uVideoSize;
uniform sampler2D uFeedback;

out vec4 fragColor;

${LUMA}
${COVER}

float luma(vec2 uv) {
  return dot(LUMA, texture(uVideo, (uv - 0.5) * coverScale(uResolution, uVideoSize) + 0.5).rgb);
}
`;

// Red is the mask, green the brightness it was measured against, blue whether there
// was a frame before: without it the first one differs from black everywhere. A trail
// under one step of eight bits is cut, or a GPU without half floats never clears it.
export const FEEDBACK = /* glsl */ `${INPUTS}
uniform float uThreshold;
uniform float uDecay;
uniform float uDelta;

void main() {
  fragColor = vec4(0.0);
  if (uVideoSize.x == 0.0) return;

  vec2 uv = gl_FragCoord.xy / uResolution;
  vec4 previous = texture(uFeedback, uv);
  float now = luma(uv);
  float moved = previous.b * float(abs(now - previous.g) > uThreshold);
  float trail = previous.r * pow(uDecay, uDelta * 60.0);
  trail *= step(1.0 / 255.0, trail);
  fragColor = vec4(max(moved, trail), now, 1.0, 1.0);
}
`;

export const FRAGMENT = /* glsl */ `${INPUTS}
uniform vec3 uInk;
uniform float uSource;

void main() {
  fragColor = vec4(0.0);
  if (uVideoSize.x == 0.0) return;

  vec2 uv = gl_FragCoord.xy / uResolution;
  float mask = texture(uFeedback, uv).r;
  vec3 color = mix(vec3(luma(uv)), uInk, max(mask, 1.0 - uSource));
  fragColor = vec4(color, max(mask, uSource));
}
`;
