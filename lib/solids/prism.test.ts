import { describe, expect, it } from 'vitest';

import { vec2, type Vec2 } from '@/lib/vec2';
import { signedArea } from '@/lib/polygon';
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
const shades = (solid: Solid) => solid.sides.map(({ shade }) => shade).sort();
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
  it('shades the two sides of a box in the darkest and lightest steps', () => {
    expect(shades(box(BLOCK, RISE, camera()))).toEqual([0, 3]);
  });

  it('lights the left side more than the right', () => {
    const [a, b] = box(BLOCK, RISE, camera()).sides;
    const [left, right] = leftmost(a.corners) < leftmost(b.corners) ? [a, b] : [b, a];
    expect(left.shade).toBeGreaterThan(right.shade);
  });

  // Fixed to the camera, the light keeps every shade where it was as the eye goes round.
  it('keeps its shades when the object and the camera turn together', () => {
    const at = shades(prism(rounded(BLOCK, 8), RISE, camera()));
    for (const angle of [0.3, 1.1, 2.4]) {
      expect(shades(prism(turned(rounded(BLOCK, 8), angle), RISE, camera(ISOMETRIC.yaw + angle)))).toEqual(at);
    }
  });

  it('shows the same sides and shades whichever way its outline winds', () => {
    const ring = rounded({ ...BLOCK, radius: 5 }, 6);
    const [forward, backward] = [prism(ring, RISE, camera()), prism([...ring].reverse(), RISE, camera())];
    const sides = (solid: Solid) =>
      solid.sides.map(({ corners, shade }) => `${shade}:${leftmost(corners).toFixed(6)}`).sort();
    expect(sides(backward)).toEqual(sides(forward));
    expect(backward.silhouette.filter(isUpright)).toHaveLength(2);
  });

  // Pieces wound opposite ways cancel under the nonzero fill rule where they overlap.
  it('winds its top and every side the same way, whichever way its outline winds', () => {
    const ring = rounded({ ...BLOCK, radius: 5 }, 6);
    const solids = [RISE, { from: 0, height: 0 }].flatMap((rise) => [
      prism(ring, rise, camera()),
      prism([...ring].reverse(), rise, camera()),
    ]);
    for (const solid of solids) {
      for (const piece of [solid.top, ...solid.sides.map(({ corners }) => corners)]) {
        expect(signedArea(piece)).toBeGreaterThan(0);
      }
    }
  });

  // An edge of no length has no normal and read as turned away mid-face.
  it('takes an outline closed on its first point, from every side', () => {
    const square = rounded(BLOCK);
    for (const yaw of [0, 1, 2, 3].map((quarter) => ISOMETRIC.yaw + (quarter * Math.PI) / 2)) {
      const solid = prism([...square, square[0]], RISE, camera(yaw));
      expect(solid.crease).toHaveLength(1);
      expect(solid.silhouette.filter(isUpright)).toHaveLength(2);
    }
  });

  it('draws its silhouette round the bottom, up the sides it turns away, and over the back of its top', () => {
    const solid = box(BLOCK, RISE, camera());
    expect(solid.silhouette.filter(isUpright)).toHaveLength(2);
    const ys = solid.fill.map(({ y }) => y);
    const [lowest, highest] = [Math.max(...ys), Math.min(...ys)];
    for (const edge of [lowest, highest]) {
      expect(solid.silhouette.some((line) => line.some(({ y }) => Math.abs(y - edge) < 1e-9))).toBe(true);
    }
  });

  it('creases along the top, where it meets the sides the viewer sees', () => {
    const solid = box(BLOCK, RISE, camera());
    const onTop = (point: Vec2) => solid.top.some(({ x, y }) => x === point.x && y === point.y);
    expect(solid.crease.flat().every(onTop)).toBe(true);
  });

  it('seen from straight above, shows no side and is outlined all round its top', () => {
    const solid = box(BLOCK, RISE, { ...camera(), pitch: Math.PI / 2 });
    expect([solid.sides, solid.crease]).toEqual([[], []]);
    expect(solid.silhouette).toHaveLength(1);
  });

  // At half a side the corners meet, and a shared point would cut a face in two.
  it('keeps a pill whole: two upright edges and one crease', () => {
    const pill = box({ x: -20, z: -10, width: 40, depth: 20, radius: 10 }, { ...RISE, bevel: 1 }, camera());
    expect(pill.silhouette.filter(isUpright)).toHaveLength(2);
    expect(pill.crease).toHaveLength(1);
    expect(pill.bevel).toHaveLength(1);
  });

  it('is all silhouette when it has no height: no side, crease or bevel', () => {
    const flat = box(BLOCK, { from: 0, height: 0, bevel: 1 }, camera());
    expect(flat.sides).toEqual([]);
    expect([flat.crease, flat.bevel]).toEqual([[], []]);
    expect(flat.silhouette).toHaveLength(1);
    const [loop] = flat.silhouette;
    expect(loop[loop.length - 1]).toEqual(loop[0]);
  });

  // Seen square on, one side shows: its bevel would only retrace the crease.
  it('draws no bevel along a lone visible edge', () => {
    expect(box(BLOCK, { ...RISE, bevel: 1 }, camera(0)).bevel).toEqual([]);
  });

  it('refuses what it cannot draw truly', () => {
    const star = Array.from({ length: 5 }, (_, index) => {
      const angle = (4 * Math.PI * index) / 5;
      return vec2(10 * Math.cos(angle), 10 * Math.sin(angle));
    });
    expect(() => box(BLOCK, { from: 0, height: -2 }, camera())).toThrow(/negative/);
    const octagram = Array.from({ length: 8 }, (_, index) => {
      const angle = (6 * Math.PI * index) / 8;
      return vec2(10 * Math.cos(angle), 10 * Math.sin(angle));
    });
    const doubledBack = [vec2(0, 0), vec2(10, 0), vec2(10, 10), vec2(10, 5), vec2(10, 10), vec2(0, 10)];
    for (const pitch of [-0.3, 3.5]) {
      expect(() => box(BLOCK, RISE, { ...camera(), pitch })).toThrow(/above/);
    }
    expect(box(BLOCK, RISE, { ...camera(), pitch: ISOMETRIC.pitch - 2 * Math.PI }).sides).toHaveLength(2);
    const there = [vec2(-5.5, -2), vec2(-2.75, -1)];
    for (const outline of [star, octagram, doubledBack, there, [vec2(0, 0), vec2(5, 0), vec2(10, 0)]]) {
      expect(() => prism(outline, RISE, camera())).toThrow(/convex/);
    }
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
    const away: Plan = { ...BLOCK, x: 35, z: -60 };
    const middle = view(camera())(vec3(away.x + away.width / 2, 25, away.z + away.depth / 2)).depth;
    expect(box(away, { from: 5, height: 40 }, camera()).depth).toBeCloseTo(middle, 9);
  });

  it('is nearer the viewer the further it stands toward them', () => {
    const near = box({ ...BLOCK, x: BLOCK.x + 40, z: BLOCK.z + 40 }, RISE, camera());
    expect(near.depth).toBeGreaterThan(box(BLOCK, RISE, camera()).depth);
  });
});
