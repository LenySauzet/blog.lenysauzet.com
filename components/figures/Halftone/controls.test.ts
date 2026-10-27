import { describe, expect, it } from 'vitest';

import { INITIAL, uniforms } from './controls';

describe('the halftone controls', () => {
  it('reach the shader as numbers, a switch as one or zero', () => {
    expect(uniforms({ ...INITIAL, radius: 0.25, cells: 16, dots: false, luma: true })).toEqual({
      uRadius: 0.25,
      uCells: 16,
      uDots: 0,
      uPixelate: 1,
      uLuma: 1,
    });
  });
});
