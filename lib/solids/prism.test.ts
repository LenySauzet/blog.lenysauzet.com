import { describe, expect, it } from 'vitest';

import { vec2, type Vec2 } from '@/lib/vec2';
import { ISOMETRIC, vec3, view, type Camera } from '@/lib/vec3';

import { rounded, type Plan } from './outline';
import { box, post, prism, type Solid } from './prism';

const camera = (yaw = ISOMETRIC.yaw): Camera => ({
  yaw,
  pitch: ISOMETRIC.pitch,
  scale: 2,
  origin: vec2(300, 170),
});
const BLOCK: Plan = { x: -20, z: -15, width: 40, depth: 30, radius: 0 };
const RISE = { from: 0, height: 12 };

const isUpright = (line: Vec2[]) => line.length === 2 && Math.abs(line[0].x - line[1].x) < 1e-9;
const tones = (solid: Solid) => solid.sides.map(({ tone }) => tone).sort();
const leftmost = (points: Vec2[]) => Math.min(...points.map(({ x }) => x));

function inside(point: Vec2, polygon: readonly Vec2[]) {
  const turns = polygon.map((a, index) => {
    const b = polygon[(index + 1) % polygon.length];
    return (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
  });
  return turns.every((turn) => turn >= -1e-6) || turns.every((turn) => turn <= 1e-6);
}

const turned = (points: Vec2[], angle: number) =>
  points.map(({ x, y }) =>
    vec2(x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)),
  );

describe('a prism', () => {
  it('shows the two sides of a box that face the viewer, and no more', () => {
    expect(box(BLOCK, RISE, camera()).sides).toHaveLength(2);
  });

  it('fills a hull that holds every side, so nothing behind shows through', () => {
    const solid = box({ ...BLOCK, radius: 6 }, RISE, camera());
    for (const { corners } of solid.sides) {
      for (const corner of corners) expect(inside(corner, solid.fill)).toBe(true);
    }
  });

  // The light comes from the viewer's left.
  it('lights the left side more than the right', () => {
    const [a, b] = box(BLOCK, RISE, camera()).sides;
    const [left, right] = leftmost(a.corners) < leftmost(b.corners) ? [a, b] : [b, a];
    expect(left.tone).toBeGreaterThan(right.tone);
  });

  // Fixed to the camera, the light keeps every tone where it was as the eye goes round.
  it('keeps its tones when the object and the camera turn together', () => {
    const at = tones(prism(rounded(BLOCK, 8), RISE, camera()));
    for (const angle of [0.3, 1.1, 2.4]) {
      expect(tones(prism(turned(rounded(BLOCK, 8), angle), RISE, camera(ISOMETRIC.yaw + angle)))).toEqual(at);
    }
  });

  it('shows the same sides and tones whichever way its outline winds', () => {
    const ring = rounded({ ...BLOCK, radius: 5 }, 6);
    const [forward, backward] = [prism(ring, RISE, camera()), prism([...ring].reverse(), RISE, camera())];
    const sides = (solid: Solid) =>
      solid.sides.map(({ corners, tone }) => `${tone}:${leftmost(corners).toFixed(6)}`).sort();
    expect(sides(backward)).toEqual(sides(forward));
    expect(backward.silhouette.filter(isUpright)).toHaveLength(2);
  });

  it('draws its silhouette round the bottom it stands on and up the two sides it turns away', () => {
    const solid = box(BLOCK, RISE, camera());
    expect(solid.silhouette.filter(isUpright)).toHaveLength(2);
    const lowest = Math.max(...solid.fill.map(({ y }) => y));
    expect(solid.silhouette.some((line) => line.some(({ y }) => Math.abs(y - lowest) < 1e-9))).toBe(true);
  });

  // At half a side the corners meet, and a shared point would cut a face in two.
  it('keeps a pill whole: two upright edges and one crease', () => {
    const pill = box({ x: -20, z: -10, width: 40, depth: 20, radius: 10 }, { ...RISE, bevel: 1 }, camera());
    expect(pill.silhouette.filter(isUpright)).toHaveLength(2);
    expect(pill.crease).toHaveLength(1);
    expect(pill.bevel).toHaveLength(1);
  });

  it('has no sides and no upright edges when it has no height', () => {
    const flat = box(BLOCK, { from: 0, height: 0 }, camera());
    expect(flat.sides).toEqual([]);
    expect(flat.silhouette.some(isUpright)).toBe(false);
  });

  it('sets its bevel in by exactly the distance asked for, from both edges of a corner', () => {
    const solid = box(BLOCK, { ...RISE, bevel: 2 }, camera());
    expect(box(BLOCK, RISE, camera()).bevel).toEqual([]);
    const [line] = solid.bevel;
    const corner = view(camera())(vec3(BLOCK.x + BLOCK.width - 2, RISE.height, BLOCK.z + BLOCK.depth - 2)).at;
    expect(line).toHaveLength(3);
    expect(line[1].x).toBeCloseTo(corner.x, 9);
    expect(line[1].y).toBeCloseTo(corner.y, 9);
  });

  // A wide corner needs more reach along its bisector than a right angle to keep its distance.
  it('keeps its bevel the same distance from the edges at any corner', () => {
    const [steps, radius, bevel] = [8, 20, 2];
    const solid = post(vec2(0, 0), radius, { ...RISE, bevel }, camera(), steps);
    const reach = radius - bevel / Math.cos(Math.PI / steps);
    const insetCorners = Array.from({ length: steps }, (_, index) => {
      const angle = (2 * Math.PI * index) / steps;
      return view(camera())(vec3(reach * Math.cos(angle), RISE.height, reach * Math.sin(angle))).at;
    });
    for (const point of solid.bevel[0].slice(1, -1)) {
      expect(insetCorners.some(({ x, y }) => Math.hypot(x - point.x, y - point.y) < 1e-9)).toBe(true);
    }
  });

  // An inward corner hides edges a convex drawing would show: an L is two boxes.
  it('refuses an outline that turns inward', () => {
    const notched = [vec2(0, 0), vec2(30, 0), vec2(30, 30), vec2(15, 10), vec2(0, 30)];
    expect(() => prism(notched, RISE, camera())).toThrow(/convex/);
  });

  it('measures its depth half way up, where a painter compares it with its neighbours', () => {
    const [short, tall] = [box(BLOCK, { from: 0, height: 4 }, camera()), box(BLOCK, { from: 0, height: 40 }, camera())];
    expect(tall.depth).toBeGreaterThan(short.depth);
  });

  it('is nearer the viewer the further it stands toward them', () => {
    const near = box({ ...BLOCK, x: BLOCK.x + 40, z: BLOCK.z + 40 }, RISE, camera());
    expect(near.depth).toBeGreaterThan(box(BLOCK, RISE, camera()).depth);
  });
});
