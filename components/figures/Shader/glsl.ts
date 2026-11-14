export const LUMA = /* glsl */ `const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);`;

export const COVER = /* glsl */ `
vec2 coverScale(vec2 frame, vec2 image) {
  float canvas = frame.x / frame.y;
  float picture = image.x / image.y;
  return picture > canvas ? vec2(canvas / picture, 1.0) : vec2(1.0, picture / canvas);
}
`;
