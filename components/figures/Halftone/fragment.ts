export const FRAGMENT = /* glsl */ `
precision highp float;

uniform vec2 uResolution;
uniform sampler2D uImage;
uniform vec2 uImageSize;
uniform float uCells;
uniform float uRadius;
uniform float uDots;
uniform float uPixelate;
uniform float uLuma;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

vec2 cover(vec2 at) {
  float canvas = uResolution.x / uResolution.y;
  float image = uImageSize.x / uImageSize.y;
  vec2 scale = image > canvas ? vec2(canvas / image, 1.0) : vec2(1.0, image / canvas);
  return (at - 0.5) * scale + 0.5;
}

void main() {
  gl_FragColor = vec4(0.0);
  if (uImageSize.x == 0.0) return;

  float cell = uResolution.x / uCells;
  vec2 offset = vec2(0.0, 0.5 * mod(uResolution.y, cell));
  vec2 centre = (floor((gl_FragCoord.xy - offset) / cell) + 0.5) * cell + offset;
  vec2 at = mix(gl_FragCoord.xy, centre, uPixelate) / uResolution;
  vec3 color = texture2D(uImage, cover(at)).rgb;

  float radius = uRadius * mix(1.0, 0.1 + dot(LUMA, color), uLuma);
  float edge = 0.5 / cell;
  float disc = 1.0 - smoothstep(radius - edge, radius + edge, length(gl_FragCoord.xy - centre) / cell);
  gl_FragColor = vec4(color, mix(1.0, disc, uDots));
}
`;
