export const FRAGMENT = /* glsl */ `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uFrequency;
uniform float uAmplitude;
uniform float uExtent;
uniform float uCentre;
uniform vec3 uLight;
uniform vec3 uRight;
uniform vec3 uUp;
uniform vec3 uToward;
uniform vec3 uInk;
uniform vec3 uShine;
uniform float uNormals;

const float PI = 3.14159265;
const int STEPS = 320;
const int REFINE = 8;
const float CLEARANCE = 0.01;
const float SPEED = 2.0;

float height(vec2 p) {
  return uAmplitude * cos(uFrequency * PI * length(p) - uTime * SPEED);
}

float above(vec3 p) {
  return sign(p.y - height(p.xz));
}

vec3 normalAt(vec2 p) {
  float r = max(length(p), 1e-4);
  vec2 slope = -uAmplitude * uFrequency * PI * sin(uFrequency * PI * r - uTime * SPEED) * p / r;
  return normalize(vec3(-slope.x, 1.0, -slope.y));
}

void main() {
  vec2 screen = (gl_FragCoord.xy - 0.5 * uResolution) / (0.5 * uResolution.x) * uExtent;
  vec3 dir = -uToward;
  vec3 origin = uRight * screen.x + uUp * (screen.y + uCentre) + uToward * 4.0;

  float top = uAmplitude + CLEARANCE;
  vec3 near = (vec3(-1.0, -top, -1.0) - origin) / dir;
  vec3 far = (vec3(1.0, top, 1.0) - origin) / dir;
  vec3 first = min(near, far);
  vec3 last = max(near, far);
  float enter = max(max(first.x, first.y), first.z);
  float leave = min(min(last.x, last.y), last.z);

  gl_FragColor = vec4(0.0);
  if (enter > leave) return;

  float stride = (leave - enter) / float(STEPS);
  float side = above(origin + dir * enter);
  float from = enter;
  float to = -1.0;
  for (int i = 1; i <= STEPS; i++) {
    float t = enter + stride * float(i);
    if (above(origin + dir * t) != side) {
      to = t;
      break;
    }
    from = t;
  }
  if (to < 0.0) return;

  for (int i = 0; i < REFINE; i++) {
    float mid = 0.5 * (from + to);
    if (above(origin + dir * mid) == side) from = mid;
    else to = mid;
  }

  vec3 hit = origin + dir * to;
  vec3 normal = side * normalAt(hit.xz);
  float diffuse = max(dot(normal, uLight), 0.0);
  vec3 shaded = mix(uInk, uShine, diffuse);
  gl_FragColor = vec4(mix(shaded, normal * 0.5 + 0.5, uNormals), 1.0);
}
`;
