export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export const vec2 = (x: number, y: number): Vec2 => ({ x, y });

export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });

export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });

export const scale = (v: Vec2, k: number): Vec2 => ({ x: v.x * k, y: v.y * k });

export const dot = (a: Vec2, b: Vec2) => a.x * b.x + a.y * b.y;

export const lengthSq = (v: Vec2) => dot(v, v);

export const length = (v: Vec2) => Math.sqrt(lengthSq(v));

/** A zero vector normalises to itself, not to `NaN`. */
export const normalize = (v: Vec2): Vec2 => {
  const len = length(v);
  return len === 0 ? v : scale(v, 1 / len);
};

/** Clockwise on screen: SVG's y axis points down, and flipping it would carry
    every label upside down. */
export const fromAngle = (radians: number, len = 1): Vec2 => ({
  x: Math.cos(radians) * len,
  y: Math.sin(radians) * len,
});
