import { describe, expect, it } from 'vitest';

import { vec2, type Vec2 } from '@/lib/vec2';
import { ISOMETRIC, vec3, view, type Camera } from '@/lib/vec3';

import { coil, dial, frontArc, knurl, onFace, seam, ticks } from './marks';
import { rounded, type Plan } from './outline';
import { box, post } from './prism';

const CAMERA: Camera = { yaw: ISOMETRIC.yaw + 0.2, pitch: ISOMETRIC.pitch, scale: 2, origin: vec2(300, 170) };
const project = view(CAMERA);

const uprightsOf = (lines: Vec2[][]) =>
  lines.filter((line) => line.length === 2 && Math.abs(line[0].x - line[1].x) < 1e-9).map((line) => line[0].x);

const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
const ends = (line: Vec2[]) => [line[0], line[line.length - 1]];

describe('a seam', () => {
  const plan: Plan = { x: -40, z: -30, width: 80, depth: 60, radius: 6 };

  // A seam stopping short of the corners reads as a texture that ends in mid-air.
  it('runs round a box from one edge of its silhouette to the other, either way it winds', () => {
    const uprights = uprightsOf(box(plan, { from: 0, height: 12 }, CAMERA).silhouette);
    for (const outline of [rounded(plan, 8), [...rounded(plan, 8)].reverse()]) {
      const lines = seam(outline, 5, CAMERA);
      expect(lines).toHaveLength(1);
      for (const end of ends(lines[0])) expect(uprights.some((x) => near(x, end.x))).toBe(true);
    }
  });
});

describe('the marks round a post', () => {
  it('band exactly the half that faces the viewer', () => {
    const arc = frontArc(vec2(0, 0), 6, 4, CAMERA);
    const uprights = uprightsOf(post(vec2(0, 0), 6, { from: 0, height: 10 }, CAMERA, 96).silhouette);
    const xs = ends(arc).map(({ x }) => x);
    expect(Math.min(...xs)).toBeCloseTo(Math.min(...uprights), 0);
    expect(Math.max(...xs)).toBeCloseTo(Math.max(...uprights), 0);
  });

  it('knurl only the side the viewer sees', () => {
    const lines = knurl(vec2(0, 0), 6, [0, 4], 36, CAMERA);
    expect(lines.length).toBeGreaterThan(8);
    expect(lines.length).toBeLessThan(18);
  });
});

describe('a coil', () => {
  // The rod is painted between the halves, so no stretch of wire is on both sides.
  it('alternates behind its rod and in front of it, turn after turn', () => {
    const { behind, front } = coil(vec3(-20, 6, 0), vec3(30, 6, 0), 4, 6, CAMERA);
    expect(behind.length + front.length).toBe(13);
    expect(Math.abs(behind.length - front.length)).toBe(1);
  });

  it('stands on an upright axis too', () => {
    const { behind, front } = coil(vec3(0, 0, 0), vec3(0, 40, 0), 4, 6, CAMERA);
    const points = [...behind, ...front].flat();
    expect(points.every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);
    expect(behind.length + front.length).toBe(13);
  });
});

describe('a ruler', () => {
  const scale = {
    from: vec3(0, 0, 0),
    to: vec3(100, 0, 0),
    outward: vec3(0, 0, 1),
    step: 5,
    every: 5,
    lengths: [2, 4] as const,
  };

  it('roots every tick on its edge, a step apart, a major one every fifth', () => {
    const { minor, major } = ticks(scale, CAMERA);
    expect(major).toHaveLength(5);
    expect(minor).toHaveLength(16);
    const [a, b] = [project(scale.from).at, project(scale.to).at];
    const across = ({ x, y }: Vec2) => (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
    for (const line of [...minor, ...major]) expect(near(across(line[0]), 0)).toBe(true);
    const roots = [...minor, ...major].map((line) => line[0]).sort((p, q) => p.x - q.x);
    expect(roots[0].x).toBeCloseTo(a.x, 9);
    expect(roots[1].x).toBeCloseTo(project(vec3(5, 0, 0)).at.x, 9);
  });

  it('draws nothing along an edge with no length, and refuses a step of nothing', () => {
    expect(ticks({ ...scale, to: scale.from }, CAMERA)).toEqual({ minor: [], major: [] });
    expect(() => ticks({ ...scale, step: 0 }, CAMERA)).toThrow(/step/);
  });
});

describe('a dial', () => {
  const lengths = [1, 2] as const;

  it('closes a whole turn, either way round, without drawing its zero twice', () => {
    for (const span of [2 * Math.PI, -2 * Math.PI]) {
      const { minor, major } = dial(vec2(0, 0), 15, 0, { count: 50, every: 5, lengths, span }, CAMERA);
      expect(minor.length + major.length).toBe(50);
    }
  });

  it('draws both ends of a partial span', () => {
    const { minor, major } = dial(vec2(0, 0), 15, 0, { count: 10, every: 5, lengths, span: Math.PI }, CAMERA);
    expect(minor.length + major.length).toBe(11);
    expect(major).toHaveLength(3);
  });

  it('points its zero to -z and turns clockwise seen from above', () => {
    const { major } = dial(vec2(0, 0), 15, 0, { count: 4, every: 1, lengths }, CAMERA);
    const expected = [vec3(0, 0, -15), vec3(15, 0, 0), vec3(0, 0, 15), vec3(-15, 0, 0)].map((point) => project(point).at);
    major.forEach((line, index) => {
      expect(line[1].x).toBeCloseTo(expected[index].x, 9);
      expect(line[1].y).toBeCloseTo(expected[index].y, 9);
    });
  });
});

describe('a face', () => {
  it('takes flat content so its axes land on the face’s own edges', () => {
    const matrix = onFace(vec3(4, 10, -2), vec3(1, 0, 0), vec3(0, -1, 0), CAMERA);
    const [a, b, c, d, e, f] = matrix.slice(7, -1).split(' ').map(Number);
    const at = project(vec3(7, 8, -2)).at;
    expect(a * 3 + c * 2 + e).toBeCloseTo(at.x, 2);
    expect(b * 3 + d * 2 + f).toBeCloseTo(at.y, 2);
  });
});
