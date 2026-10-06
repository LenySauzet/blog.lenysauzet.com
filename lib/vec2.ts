/** A point or a direction in the plane. Readonly, so a figure cannot drift one. */
export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export const vec2 = (x: number, y: number): Vec2 => ({ x, y });

export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });

export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });

export const scale = (v: Vec2, k: number): Vec2 => ({ x: v.x * k, y: v.y * k });

export const dot = (a: Vec2, b: Vec2) => a.x * b.x + a.y * b.y;

/** Squared, so a comparison or a quadratic never pays for a square root. */
export const lengthSq = (v: Vec2) => dot(v, v);

export const length = (v: Vec2) => Math.sqrt(lengthSq(v));

export const distance = (a: Vec2, b: Vec2) => length(sub(a, b));

/** A zero vector normalises to itself rather than to `NaN`. */
export const normalize = (v: Vec2): Vec2 => {
  const len = length(v);
  return len === 0 ? v : scale(v, 1 / len);
};

/**
 * SVG's y axis points down, so a positive angle turns clockwise on screen. The
 * figures are authored in that space rather than flipped into it: a flip would
 * carry every label upside down with it.
 */
export const fromAngle = (radians: number, len = 1): Vec2 => ({
  x: Math.cos(radians) * len,
  y: Math.sin(radians) * len,
});

export const lerp = (a: Vec2, b: Vec2, t: number): Vec2 =>
  add(a, scale(sub(b, a), t));
