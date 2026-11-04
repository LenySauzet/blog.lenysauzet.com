import { describe, expect, it } from 'vitest';

import { vec2, type Vec2 } from '@/lib/vec2';
import { ISOMETRIC, type Camera } from '@/lib/vec3';

import { rounded, type Plan } from './outline';
import { box, prism, type Solid } from './prism';

const camera = (yaw = ISOMETRIC.yaw): Camera => ({ yaw, pitch: ISOMETRIC.pitch, scale: 2, origin: vec2(300, 170) });
const BLOCK: Plan = { x: -20, z: -15, width: 40, depth: 30, radius: 0 };
const RISE = { from: 0, height: 12 };

const inside = (point: Vec2, polygon: readonly Vec2[]) =>
  polygon.every((a, index) => {
    const b = polygon[(index + 1) % polygon.length];
    return (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x) >= -1e-6;
  }) ||
  polygon.every((a, index) => {
    const b = polygon[(index + 1) % polygon.length];
    return (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x) <= 1e-6;
  });

const tones = (solid: Solid) => solid.sides.map(({ tone }) => tone).sort();

describe('a prism', () => {
  it('shows the two sides of a box that face the viewer, and no more', () => {
    expect(box(BLOCK, RISE, camera()).sides).toHaveLength(2);
  });

  it('fills a hull that holds every side, so nothing behind shows through', () => {
    const solid = box({ ...BLOCK, radius: 6 }, RISE, camera());
    for (const { corners } of solid.sides) for (const corner of corners) expect(inside(corner, solid.fill[0])).toBe(true);
  });

  // The light comes from the viewer's left.
  it('lights the left side more than the right', () => {
    const [a, b] = box(BLOCK, RISE, camera()).sides;
    const leftmost = (corners: Vec2[]) => Math.min(...corners.map(({ x }) => x));
    const [left, right] = leftmost(a.corners) < leftmost(b.corners) ? [a, b] : [b, a];
    expect(left.tone).toBeGreaterThan(right.tone);
  });

  // Fixed to the camera, the light keeps every tone where it was as the eye goes round.
  it('keeps its tones when the object and the camera turn together', () => {
    const turned = (angle: number) =>
      rounded(BLOCK, 8).map(({ x, y }) => vec2(x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)));
    for (const angle of [0.3, 1.1, 2.4]) {
      expect(tones(prism(turned(angle), RISE, camera(ISOMETRIC.yaw + angle)))).toEqual(tones(prism(rounded(BLOCK, 8), RISE, camera())));
    }
  });

  it('draws the silhouette with one upright edge at each side it turns away', () => {
    const uprights = box(BLOCK, RISE, camera()).outline.filter((line) => line.length === 2 && Math.abs(line[0].x - line[1].x) < 1e-9);
    expect(uprights).toHaveLength(2);
  });

  it('has no sides and no upright edges when it has no height', () => {
    const flat = box(BLOCK, { from: 0, height: 0 }, camera());
    expect(flat.sides).toEqual([]);
    expect(flat.outline.every((line) => line.length > 2)).toBe(true);
  });

  it('bevels only when asked to, along the visible top edges', () => {
    expect(box(BLOCK, RISE, camera()).bevel).toEqual([]);
    expect(box(BLOCK, { ...RISE, bevel: 1.2 }, camera()).bevel).toHaveLength(1);
  });

  // A hull would bridge the notch of an L across what it should leave open.
  it('fills a concave outline from its faces', () => {
    const notched = [vec2(0, 0), vec2(30, 0), vec2(30, 30), vec2(15, 10), vec2(0, 30)];
    expect(prism(notched, RISE, camera()).fill).toHaveLength(1);
    expect(prism(notched, { ...RISE, concave: true }, camera()).fill.length).toBeGreaterThan(2);
  });

  it('is nearer the viewer the further it stands toward them', () => {
    const near = box({ ...BLOCK, x: BLOCK.x + 40, z: BLOCK.z + 40 }, RISE, camera());
    expect(near.depth).toBeGreaterThan(box(BLOCK, RISE, camera()).depth);
  });
});
