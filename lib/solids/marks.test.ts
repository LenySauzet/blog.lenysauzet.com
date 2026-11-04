import { describe, expect, it } from 'vitest';

import { vec2, type Vec2 } from '@/lib/vec2';
import { ISOMETRIC, vec3, view, type Camera, type Vec3 } from '@/lib/vec3';

import { band, coil, dial, knurl, onFace, projected, rim, seam, ticks } from './marks';
import { rounded, type Plan } from './outline';
import { block, cylinder } from './prism';

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
  // An inward corner hides part of the edges a seam would run along.
  it('refuses a concave outline, as a solid does', () => {
    const ell = [vec2(0, 0), vec2(30, 0), vec2(30, 10), vec2(10, 10), vec2(10, 30), vec2(0, 30)];
    expect(() => seam(ell, 5, CAMERA)).toThrow(/convex/);
  });

  it('runs round the near side of a box, from one edge of its silhouette to the other', () => {
    const uprights = uprightsOf(block(plan, { from: 0, height: 12 }, CAMERA).silhouette);
    const centre = depthOf(vec3(0, 5, 0));
    for (const outline of [rounded(plan, 8), [...rounded(plan, 8)].reverse()]) {
      const strokes = seam(outline, 5, CAMERA);
      expect(strokes).toHaveLength(1);
      for (const yaw of [0, 1, 2, 3].map((quarter) => CAMERA.yaw + (quarter * Math.PI) / 2)) {
        expect(seam([...outline, outline[0]], 5, { ...CAMERA, yaw })).toHaveLength(1);
      }
      expect(depthOf(middleOf(strokes[0]))).toBeGreaterThan(centre);
      const [line] = projected(strokes, CAMERA);
      expect(line[0]).toEqual(lens(strokes[0][0]).at);
      for (const end of ends(line)) expect(uprights.some((x) => near(x, end.x))).toBe(true);
    }
  });
});

describe('the marks round a post', () => {
  const centre = depthOf(vec3(0, 4, 0));

  // A true half circle would overshoot the facets of the cylinder it bands.
  it('band the near half, ending on the cylinder’s own edges', () => {
    const [arc] = band(vec2(0, 0), 8, 4, CAMERA, 16);
    expect(depthOf(middleOf(arc))).toBeGreaterThan(centre);
    const uprights = uprightsOf(cylinder(vec2(0, 0), 8, { from: 0, height: 10 }, CAMERA, 16).silhouette);
    const xs = ends(projected([arc], CAMERA)[0]).map(({ x }) => x);
    expect(Math.min(...xs)).toBeCloseTo(Math.min(...uprights), 9);
    expect(Math.max(...xs)).toBeCloseTo(Math.max(...uprights), 9);
  });

  // Nearer the limb than this, the lines crowd into a grey band.
  it('knurl no closer to the limb than its cut', () => {
    for (const [bottom] of knurl(vec2(0, 0), 6, [0, 4], 72, CAMERA)) {
      const facing = depthOf(bottom) - depthOf(vec3(0, 0, 0));
      expect(facing / (6 * Math.cos(CAMERA.pitch))).toBeGreaterThan(0.15 - 1e-9);
    }
  });

  // How close to the limb the lines crowd is a matter of the floor, not of the pitch.
  it('knurl only the near side, cut at the same line at any pitch', () => {
    const counts = [0.3, ISOMETRIC.pitch, 1.2].map((pitch) => {
      const strokes = knurl(vec2(0, 0), 6, [0, 4], 36, { ...CAMERA, pitch });
      for (const [bottom] of strokes) expect(depthOf(bottom)).toBeGreaterThan(depthOf(vec3(0, 0, 0)));
      return strokes.length;
    });
    expect(counts).toEqual([16, 16, 16]);
  });

  it('knurl from the foot of the grip to its top', () => {
    for (const [bottom, top] of knurl(vec2(0, 0), 6, [1, 4], 36, CAMERA)) {
      expect([bottom.y, top.y]).toEqual([1, 4]);
      expect([top.x, top.z]).toEqual([bottom.x, bottom.z]);
    }
  });

  it('ring a face whole and closed', () => {
    const [loop] = rim(vec2(1, 2), 3, 7, 12);
    expect(loop).toHaveLength(13);
    expect(loop[12]).toEqual(loop[0]);
    expect(loop.every(({ y }) => y === 7)).toBe(true);
  });
});

describe('a coil', () => {
  const axisAt = (point: Vec3, from: Vec3, to: Vec3) => {
    const along = vec3(to.x - from.x, to.y - from.y, to.z - from.z);
    const length = Math.hypot(along.x, along.y, along.z);
    const t =
      ((point.x - from.x) * along.x + (point.y - from.y) * along.y + (point.z - from.z) * along.z) / length ** 2;
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

  it('winds one unbroken wire at its radius, sixteen samples a turn', () => {
    const [from, to] = [vec3(-20, 6, 0), vec3(30, 6, 0)];
    const { behind, front } = coil(from, to, 4, 6, CAMERA);
    const strokes = [...behind, ...front];
    expect(strokes.every((stroke) => stroke.length >= 2)).toBe(true);
    for (const point of strokes.flat()) expect(Math.hypot(point.y - 6, point.z)).toBeCloseTo(4, 9);
    const key = ({ x, y, z }: Vec3) => [x, y, z].map((value) => value.toFixed(9)).join();
    const starts = new Set(strokes.map((stroke) => key(stroke[0])));
    const joined = strokes.filter((stroke) => starts.has(key(stroke[stroke.length - 1])));
    expect(joined).toHaveLength(strokes.length - 1);
    expect(new Set(strokes.flat().map(key)).size).toBe(6 * 16 + 1);
  });

  // A wire turning to the other side on its very last sample leaves that point alone.
  it('never ends on a stretch of one point', () => {
    const { behind, front } = coil(vec3(-20, 6, 0), vec3(30, 6, 0), 4, 0.1459, CAMERA, 7);
    expect([...behind, ...front].every((stroke) => stroke.length >= 2)).toBe(true);
  });

  it('draws a wire that barely turns, rather than nothing or numbers that are not', () => {
    const { behind, front } = coil(vec3(0, 0, 0), vec3(10, 0, 0), 2, 0.01, CAMERA);
    const points = [...behind, ...front].flat();
    expect(points.length).toBeGreaterThanOrEqual(2);
    expect(points.every(({ x, y, z }) => [x, y, z].every(Number.isFinite))).toBe(true);
  });

  it('refuses ends that meet, a wire that does not turn, or one never sampled', () => {
    expect(() => coil(vec3(1, 1, 1), vec3(1, 1, 1), 4, 6, CAMERA)).toThrow(/apart/);
    expect(() => coil(vec3(0, 0, 0), vec3(9, 0, 0), 4, 6, CAMERA, 0)).toThrow(/turn/);
    for (const turns of [0, -3]) {
      expect(() => coil(vec3(0, 0, 0), vec3(9, 0, 0), 4, turns, CAMERA)).toThrow(/turn/);
    }
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
    for (const [root, tip] of minor) expect([root.y, root.z, tip.z]).toEqual([0, 0, 2]);
    for (const [root, tip] of major) expect([root.y, root.z, tip.z]).toEqual([0, 0, 4]);
    expect([...minor, ...major].map(([root]) => root.x).sort((a, b) => a - b).slice(0, 2)).toEqual([0, 5]);
  });

  // 0.3 over 0.1 falls a hair short of 3 in floating point, and the last tick with it.
  it('reaches the end of an edge that is a whole number of steps long', () => {
    const { minor, major } = ticks({ ...scale, to: vec3(0.3, 0, 0), step: 0.1 });
    expect(minor.length + major.length).toBe(4);
  });

  it('draws nothing along an edge with no length, and refuses a step or a period of nothing', () => {
    expect(ticks({ ...scale, to: scale.from })).toEqual({ minor: [], major: [] });
    expect(() => ticks({ ...scale, step: 0 })).toThrow(/positive/);
    for (const every of [0, 2.5]) expect(() => ticks({ ...scale, every })).toThrow(/whole/);
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

  it('grows its ticks inward from the rim, the minor ones shorter, starting where asked', () => {
    const { minor, major } = dial(vec2(0, 0), 15, 0, { count: 8, every: 2, lengths: [1, 2], from: Math.PI / 2 });
    const reaches = (stroke: Vec3[]) => stroke.map(({ x, z }) => +Math.hypot(x, z).toFixed(9));
    for (const stroke of minor) expect(reaches(stroke)).toEqual([14, 15]);
    for (const stroke of major) expect(reaches(stroke)).toEqual([13, 15]);
    expect(major[0][1].x).toBeCloseTo(15, 9);
    expect(major[0][1].z).toBeCloseTo(0, 9);
  });

  it('refuses a dial of no ticks or no span', () => {
    expect(() => dial(vec2(0, 0), 15, 0, { count: 0, every: 1, lengths })).toThrow(/nothing/);
    for (const asked of [{ count: 2.5 }, { every: 0 }, { every: 1.5 }, { span: 0 }, { span: NaN }]) {
      expect(() => dial(vec2(0, 0), 15, 0, { count: 5, every: 1, lengths, ...asked })).toThrow(/whole|nothing/);
    }
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
