import { COVER, LUMA } from '@/components/Shader/glsl';

export const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform sampler2D uImage;
uniform vec2 uImageSize;
uniform float uCells;
uniform float uRadius;
uniform float uDots;
uniform float uPixelate;
uniform float uLuma;

out vec4 fragColor;

${LUMA}
${COVER}

void main() {
  fragColor = vec4(0.0);
  if (uImageSize.x == 0.0) return;

  float cell = uResolution.x / uCells;
  vec2 offset = vec2(0.0, 0.5 * mod(uResolution.y, cell));
  vec2 centre = (floor((gl_FragCoord.xy - offset) / cell) + 0.5) * cell + offset;

  vec2 scale = coverScale(uResolution, uImageSize);
  vec2 at = (mix(gl_FragCoord.xy, centre, uPixelate) / uResolution - 0.5) * scale + 0.5;
  float texelsPerCell = cell * uImageSize.x * scale.x / uResolution.x;
  vec3 color = uPixelate > 0.5
    ? textureLod(uImage, at, log2(max(texelsPerCell, 1.0))).rgb
    : texture(uImage, at).rgb;

  float radius = min(uRadius * mix(1.0, 0.1 + dot(LUMA, color), uLuma), 0.5);
  float reach = length(gl_FragCoord.xy - centre) / cell;
  float disc = 1.0 - smoothstep(radius - fwidth(reach), radius, reach);
  // Opaque over black in either theme: on a light page the biggest, brightest
  // dots would vanish into it.
  fragColor = vec4(color * mix(1.0, disc, uDots), 1.0);
}
`;
