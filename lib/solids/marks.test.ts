import { describe, expect, it } from 'vitest';

import { vec2, type Vec2 } from '@/lib/vec2';
import { ISOMETRIC, vec3, view, type Camera } from '@/lib/vec3';

import { coil, dial, frontArc, knurl, onFace, seam, ticks } from './marks';
import { rounded, type Plan } from './outline';
import { box, post } from './prism';

const CAMERA: Camera = { yaw: ISOMETRIC.yaw + 0.2, pitch: ISOMETRIC.pitch, scale: 2, origin: vec2(300, 170) };

const uprightsOf = (outline: Vec2[][]) =>
  outline.filter((line) => line.length === 2 && Math.abs(line[0].x - line[1].x) < 1e-9).map((line) => line[0].x);

const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

describe('the marks', () => {
  // A seam stopping short of the corners reads as a texture that ends in mid-air.
  it('runs a seam round a box from one edge of its silhouette to the other', () => {
    const plan: Plan = { x: -40, z: -30, width: 80, depth: 60, radius: 6 };
    const lines = seam(rounded(plan, 8), 5, CAMERA);
    const uprights = uprightsOf(box(plan, { from: 0, height: 12 }, CAMERA).outline);
    expect(lines).toHaveLength(1);
    const [line] = lines;
    for (const end of [line[0], line[line.length - 1]]) expect(uprights.some((x) => near(x, end.x))).toBe(true);
  });

  it('bands a post along exactly the half that faces the viewer', () => {
    const arc = frontArc(vec2(0, 0), 6, 4, CAMERA);
    const uprights = uprightsOf(post(vec2(0, 0), 6, { from: 0, height: 10 }, CAMERA, 96).outline);
    const [left, right] = [Math.min(...uprights), Math.max(...uprights)];
    expect(Math.min(arc[0].x, arc[arc.length - 1].x)).toBeCloseTo(left, 0);
    expect(Math.max(arc[0].x, arc[arc.length - 1].x)).toBeCloseTo(right, 0);
  });

  it('knurls only the side of a knob the viewer sees', () => {
    const lines = knurl(vec2(0, 0), 6, [0, 4], 36, CAMERA);
    expect(lines.length).toBeGreaterThan(8);
    expect(lines.length).toBeLessThan(18);
  });

  // The rod is painted between the halves, so no stretch of wire is on both sides.
  it('splits a spring into stretches that alternate behind its rod and in front', () => {
    const { behind, front } = coil(vec3(-20, 6, 0), vec3(30, 6, 0), 4, 6, CAMERA);
    expect(behind.length + front.length).toBe(13);
    expect(Math.abs(behind.length - front.length)).toBe(1);
  });

  it('roots every tick of a ruler on its edge, a major one every fifth', () => {
    const scale = { from: vec3(0, 0, 0), to: vec3(100, 0, 0), outward: vec3(0, 0, 1), step: 5, every: 5, lengths: [2, 4] as const };
    const { minor, major } = ticks(scale, CAMERA);
    expect(major).toHaveLength(5);
    expect(minor).toHaveLength(16);
    const project = view(CAMERA);
    const edge = [project(scale.from).at, project(scale.to).at];
    const across = (point: Vec2) => (edge[1].x - edge[0].x) * (point.y - edge[0].y) - (edge[1].y - edge[0].y) * (point.x - edge[0].x);
    for (const line of [...minor, ...major]) expect(near(across(line[0]), 0)).toBe(true);
    const roots = [...minor, ...major].map((line) => line[0]).sort((p, q) => p.x - q.x);
    expect(roots[0].x).toBeCloseTo(edge[0].x, 9);
    expect(roots[1].x).toBeCloseTo(project(vec3(5, 0, 0)).at.x, 9);
  });

  it('closes a dial without drawing its zero twice', () => {
    const { minor, major } = dial(vec2(0, 0), 15, 0, { count: 50, every: 5, lengths: [1, 2] }, CAMERA);
    expect(minor.length + major.length).toBe(50);
  });

  it('lays flat content on a face so its axes land on the face’s own edges', () => {
    const origin = vec3(4, 10, -2);
    const matrix = onFace(origin, vec3(1, 0, 0), vec3(0, -1, 0), CAMERA);
    const [a, b, c, d, e, f] = matrix.slice(7, -1).split(' ').map(Number);
    const project = view(CAMERA);
    const at = project(vec3(7, 8, -2)).at;
    expect(a * 3 + c * 2 + e).toBeCloseTo(at.x, 2);
    expect(b * 3 + d * 2 + f).toBeCloseTo(at.y, 2);
  });
});
