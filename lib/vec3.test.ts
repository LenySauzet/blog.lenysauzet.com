import { describe, expect, it } from 'vitest';

import { length, sub, vec2 } from './vec2';
import {
  cross,
  dot3,
  ISOMETRIC,
  normalize3,
  scale3,
  basis,
  towardViewer,
  vec3,
  view,
} from './vec3';

const CAMERA = { ...ISOMETRIC, scale: 100, origin: vec2(0, 0) };
const angle = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  (Math.acos((a.x * b.x + a.y * b.y) / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y))) * 180) / Math.PI;

describe('scale3', () => {
  it('stretches every component alike', () => {
    expect(scale3(vec3(1, -2, 3), 2)).toEqual(vec3(2, -4, 6));
  });
});

describe('cross', () => {
  it('turns x into y into z, right-handed', () => {
    expect(cross(vec3(1, 0, 0), vec3(0, 1, 0))).toEqual(vec3(0, 0, 1));
  });
});

describe('view', () => {
  const project = view(CAMERA);

  it('lays the three axes 120 degrees apart and equally long, the isometric promise', () => {
    const [x, y, z] = [vec3(1, 0, 0), vec3(0, 1, 0), vec3(0, 0, 1)].map(
      (axis) => project(axis).at,
    );

    expect(angle(x, y)).toBeCloseTo(120);
    expect(angle(y, z)).toBeCloseTo(120);
    expect(length(x)).toBeCloseTo(length(z));
    expect(length(x)).toBeCloseTo(length(y));
  });

  it('draws up as up on the page, whose y runs down', () => {
    expect(project(vec3(0, 1, 0)).at.y).toBeLessThan(0);
  });

  it('puts the far side of the ground deeper and higher than the near side', () => {
    const [far, near] = [project(vec3(0, 0, -1)), project(vec3(0, 0, 1))];

    expect(far.depth).toBeLessThan(near.depth);
    expect(far.at.y).toBeLessThan(near.at.y);
  });

  it('moves a point by the scale it is given', () => {
    const double = view({ ...CAMERA, scale: 200 });

    expect(length(sub(double(vec3(1, 0, 0)).at, vec2(0, 0)))).toBeCloseTo(
      2 * length(project(vec3(1, 0, 0)).at),
    );
  });
});

describe('towardViewer', () => {
  it('points back along the line of sight, so the ground seen from above faces it', () => {
    expect(dot3(towardViewer(CAMERA), vec3(0, 1, 0))).toBeGreaterThan(0);
  });

  it('is the direction the camera reads as nearest', () => {
    const toward = normalize3(towardViewer(CAMERA));

    expect(view(CAMERA)(toward).depth).toBeCloseTo(1);
  });
});

describe('basis', () => {
  const { right, up, toward } = basis(CAMERA);

  it('is three unit directions at right angles', () => {
    for (const v of [right, up, toward]) expect(dot3(v, v)).toBeCloseTo(1);
    expect(dot3(right, up)).toBeCloseTo(0);
    expect(dot3(up, toward)).toBeCloseTo(0);
    expect(dot3(toward, right)).toBeCloseTo(0);
  });

  it('agrees with the projection: right moves a point rightward on the page, up moves it up', () => {
    const project = view(CAMERA);
    const origin = project(vec3(0, 0, 0)).at;

    expect(project(right).at.x - origin.x).toBeCloseTo(CAMERA.scale);
    expect(project(right).at.y - origin.y).toBeCloseTo(0);
    expect(project(up).at.y - origin.y).toBeCloseTo(-CAMERA.scale);
    expect(project(toward).depth).toBeCloseTo(1);
  });
});
