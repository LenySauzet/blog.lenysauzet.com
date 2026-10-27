import { COVER, LUMA } from '@/components/Shader/glsl';

export const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uPixelRatio;
uniform sampler2D uVideo;
uniform vec2 uVideoSize;
uniform float uPixelSize;
uniform float uRadius;

out vec4 fragColor;

${LUMA}
${COVER}

void main() {
  fragColor = vec4(0.0);
  if (uVideoSize.x == 0.0) return;

  float cell = uPixelSize * uPixelRatio;
  vec2 offset = 0.5 * mod(uResolution, cell);
  vec2 centre = (floor((gl_FragCoord.xy - offset) / cell) + 0.5) * cell + offset;
  vec2 at = (centre / uResolution - 0.5) * coverScale(uResolution, uVideoSize) + 0.5;
  vec3 color = texture(uVideo, at).rgb;

  float radius = uRadius * (1.1 - dot(LUMA, color));
  float reach = length(gl_FragCoord.xy - centre) / cell;
  float disc = 1.0 - smoothstep(radius - fwidth(reach), radius, reach);
  fragColor = vec4(mix(color, vec3(1.0), disc), 1.0);
}
`;
