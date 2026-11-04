import { describe, expect, it } from 'vitest';

import { vec2, type Vec2 } from '@/lib/vec2';
import { ISOMETRIC, vec3, view, type Camera, type Vec3 } from '@/lib/vec3';

import { coil, dial, frontArc, knurl, onFace, projected, ring, seam, ticks } from './marks';
import { rounded, type Plan } from './outline';
import { box, post } from './prism';

const CAMERA: Camera = { yaw: ISOMETRIC.yaw + 0.2, pitch: ISOMETRIC.pitch, scale: 2, origin: vec2(300, 170) };
const lens = view(CAMERA);
const depthOf = (point: Vec3) => lens(point).depth;
const middleOf = (stroke: Vec3[]) => stroke[Math.floor(stroke.length / 2)];

const uprightsOf = (lines: Vec2[][]) =>
  lines.filter((line) => line.length === 2 && Math.abs(line[0].x - line[1].x) < 1e-9).map((line) => line[0].x);

const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
const ends = <T>(line: T[]) => [line[0], line[line.length - 1]];

describe('a seam', () => {
  const plan: Plan = { x: -40, z: -30, width: 80, depth: 60, radius: 6 };

  // A seam stopping short of the corners reads as a texture that ends in mid-air.
  it('runs round the near side of a box, from one edge of its silhouette to the other', () => {
    const uprights = uprightsOf(box(plan, { from: 0, height: 12 }, CAMERA).silhouette);
    const centre = depthOf(vec3(0, 5, 0));
    for (const outline of [rounded(plan, 8), [...rounded(plan, 8)].reverse()]) {
      const strokes = seam(outline, 5, CAMERA);
      expect(strokes).toHaveLength(1);
      for (const yaw of [0, 1, 2, 3].map((quarter) => CAMERA.yaw + (quarter * Math.PI) / 2)) {
        expect(seam([...outline, outline[0]], 5, { ...CAMERA, yaw })).toHaveLength(1);
      }
      expect(depthOf(middleOf(strokes[0]))).toBeGreaterThan(centre);
      const [line] = projected(strokes, CAMERA);
      for (const end of ends(line)) expect(uprights.some((x) => near(x, end.x))).toBe(true);
    }
  });
});

describe('the marks round a post', () => {
  const centre = depthOf(vec3(0, 4, 0));

  it('band exactly the near half', () => {
    const [arc] = frontArc(vec2(0, 0), 6, 4, CAMERA);
    expect(depthOf(middleOf(arc))).toBeGreaterThan(centre);
    const uprights = uprightsOf(post(vec2(0, 0), 6, { from: 0, height: 10 }, CAMERA, 96).silhouette);
    const xs = ends(projected([arc], CAMERA)[0]).map(({ x }) => x);
    expect(Math.min(...xs)).toBeCloseTo(Math.min(...uprights), 0);
    expect(Math.max(...xs)).toBeCloseTo(Math.max(...uprights), 0);
  });

  // How close to the limb the lines crowd is a matter of the floor, not of the pitch.
  it('knurl only the near side, cut at the same line at any pitch', () => {
    const counts = [0.3, ISOMETRIC.pitch, 1.2].map((pitch) => {
      const strokes = knurl(vec2(0, 0), 6, [0, 4], 36, { ...CAMERA, pitch });
      for (const [bottom] of strokes) expect(depthOf(bottom)).toBeGreaterThan(depthOf(vec3(0, 0, 0)));
      return strokes.length;
    });
    expect(new Set(counts).size).toBe(1);
    expect(counts[0]).toBeGreaterThan(8);
  });

  it('ring a face whole and closed', () => {
    const [loop] = ring(vec2(1, 2), 3, 7, 12);
    expect(loop).toHaveLength(13);
    expect(loop[12]).toEqual(loop[0]);
    expect(loop.every(({ y }) => y === 7)).toBe(true);
  });
});

describe('a coil', () => {
  const axisAt = (point: Vec3, from: Vec3, to: Vec3) => {
    const along = vec3(to.x - from.x, to.y - from.y, to.z - from.z);
    const length = Math.hypot(along.x, along.y, along.z);
    const t = ((point.x - from.x) * along.x + (point.y - from.y) * along.y + (point.z - from.z) * along.z) / length ** 2;
    return vec3(from.x + along.x * t, from.y + along.y * t, from.z + along.z * t);
  };

  // The rod is painted between the halves, so no stretch of wire may be on the wrong one.
  it('puts every stretch in front of its axis or behind it, alternately, on any axis', () => {
    for (const [from, to] of [
      [vec3(-20, 6, 0), vec3(30, 6, 0)],
      [vec3(0, 0, 0), vec3(0, 40, 0)],
    ]) {
      const { behind, front } = coil(from, to, 4, 6, CAMERA);
      expect(behind.length + front.length).toBe(13);
      expect(Math.abs(behind.length - front.length)).toBe(1);
      const side = (point: Vec3) => depthOf(point) - depthOf(axisAt(point, from, to));
      for (const stroke of front) expect(side(middleOf(stroke))).toBeGreaterThan(0);
      for (const stroke of behind) expect(side(middleOf(stroke))).toBeLessThan(0);
    }
  });

  it('refuses ends that meet', () => {
    expect(() => coil(vec3(1, 1, 1), vec3(1, 1, 1), 4, 6, CAMERA)).toThrow(/apart/);
  });
});

describe('a ruler', () => {
  const scale = {
    from: vec3(0, 0, 0),
    to: vec3(98, 0, 0),
    outward: vec3(0, 0, 1),
    step: 5,
    every: 5,
    lengths: [2, 4] as const,
  };

  it('roots every tick on its edge, a step apart, a major one every fifth from the start', () => {
    const { minor, major } = ticks(scale);
    expect(major.map(([root]) => root.x)).toEqual([0, 25, 50, 75]);
    expect(minor).toHaveLength(16);
    for (const [root, tip] of [...minor, ...major]) {
      expect([root.y, root.z]).toEqual([0, 0]);
      expect(tip.z).toBeGreaterThan(0);
    }
    expect([...minor, ...major].map(([root]) => root.x).sort((a, b) => a - b).slice(0, 2)).toEqual([0, 5]);
  });

  it('draws nothing along an edge with no length, and refuses a step or a period of nothing', () => {
    expect(ticks({ ...scale, to: scale.from })).toEqual({ minor: [], major: [] });
    expect(() => ticks({ ...scale, step: 0 })).toThrow(/positive/);
    expect(() => ticks({ ...scale, every: 0 })).toThrow(/positive/);
  });
});

describe('a dial', () => {
  const lengths = [1, 2] as const;

  it('closes a whole turn, either way round, without drawing its zero twice', () => {
    for (const span of [2 * Math.PI, -2 * Math.PI]) {
      const { minor, major } = dial(vec2(0, 0), 15, 0, { count: 50, every: 5, lengths, span });
      expect(minor.length + major.length).toBe(50);
    }
  });

  it('draws both ends of a partial span', () => {
    const { minor, major } = dial(vec2(0, 0), 15, 0, { count: 10, every: 5, lengths, span: Math.PI });
    expect(minor.length + major.length).toBe(11);
    expect(major).toHaveLength(3);
  });

  it('points its zero to -z and turns clockwise seen from above', () => {
    const { major } = dial(vec2(0, 0), 15, 0, { count: 4, every: 1, lengths });
    const tips = major.map(([, tip]) => [tip.x, tip.z].map((value) => Math.round(value * 1e9) / 1e9 + 0));
    expect(tips).toEqual([
      [0, -15],
      [15, 0],
      [0, 15],
      [-15, 0],
    ]);
  });

  it('refuses a dial of no ticks', () => {
    expect(() => dial(vec2(0, 0), 15, 0, { count: 0, every: 1, lengths })).toThrow(/positive/);
  });
});

describe('a face', () => {
  it('takes flat content so its axes land on the face’s own edges', () => {
    const matrix = onFace(vec3(4, 10, -2), vec3(1, 0, 0), vec3(0, -1, 0), CAMERA);
    const [a, b, c, d, e, f] = matrix.slice(7, -1).split(' ').map(Number);
    const at = lens(vec3(7, 8, -2)).at;
    expect(a * 3 + c * 2 + e).toBeCloseTo(at.x, 2);
    expect(b * 3 + d * 2 + f).toBeCloseTo(at.y, 2);
  });
});
