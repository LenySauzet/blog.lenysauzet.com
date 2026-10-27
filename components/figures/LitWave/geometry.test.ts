import { describe, expect, it } from 'vitest';

import { AMPLITUDE, ripple } from '@/components/figures/Wave/geometry';
import { dot3 } from '@/lib/vec3';

import { FRAGMENT } from './fragment';
import { ASPECT, EXTENT, FREQUENCY, light, outline, uniforms } from './geometry';

describe('the light', () => {
  it('is a direction, shining from above the surface', () => {
    for (const azimuth of [0, 90, 135, 270]) {
      const l = light(azimuth);
      expect(dot3(l, l)).toBeCloseTo(1);
      expect(l.y).toBeGreaterThan(0);
    }
  });

  it('comes back round to where it started', () => {
    expect(light(360).x).toBeCloseTo(light(0).x);
    expect(light(360).z).toBeCloseTo(light(0).z);
  });

  it('reaches the shader as the slider sets it', () => {
    expect(uniforms(1, 0, 90, false).uLight[2]).toBeCloseTo(light(90).z);
  });
});

describe('the view', () => {
  const sweep = Array.from({ length: 11 }, (_, i) => FREQUENCY.min + ((FREQUENCY.max - FREQUENCY.min) * i) / 10);

  it('holds the whole surface inside the canvas, with a margin, at every frequency and every moment of its travel', () => {
    for (const frequency of sweep) {
      const { left, right, low, high } = outline(frequency);

      expect(Math.max(-left, right), `at ${frequency}`).toBeLessThan(0.9 * EXTENT);
      expect((high - low) / 2, `at ${frequency}`).toBeLessThan((0.9 * EXTENT) / ASPECT);
          }
  });

  it('centres the surface, which rises further above its middle than it falls below', () => {
    const { low, high, centre } = outline(FREQUENCY.initial);

    expect(centre).toBeGreaterThan(0);
    expect(high - centre).toBeCloseTo(centre - low);
  });
});

describe('the surface', () => {
  it('is the very ripple Wave draws in lines, so the framing measured in TypeScript fits what the shader draws', () => {
    expect(FRAGMENT).toContain('uAmplitude * cos(uFrequency * PI * length(p) - uTime * SPEED)');
    expect(uniforms(1.5, 0, 0, false).uAmplitude).toBe(AMPLITUDE);
    expect(ripple(1.5)(0.3, 0.4)).toBeCloseTo(AMPLITUDE * Math.cos(1.5 * Math.PI * 0.5));
    expect(ripple(1.5, 1)(0.3, 0.4)).toBeCloseTo(AMPLITUDE * Math.cos(1.5 * Math.PI * 0.5 - 1));
  });

  it('switches to its normals as colours, and back', () => {
    expect(uniforms(1.5, 0, 0, true).uNormals).toBe(1);
    expect(uniforms(1.5, 0, 0, false).uNormals).toBe(0);
  });
});
