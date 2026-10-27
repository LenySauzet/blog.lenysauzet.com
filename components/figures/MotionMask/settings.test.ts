import { describe, expect, it } from 'vitest';

import { INITIAL, TEXTURES, uniforms } from './settings';

describe('the motion mask settings', () => {
  it('reach the shader as numbers, the switch as one or zero', () => {
    expect(uniforms({ threshold: 0.1, decay: 0.9, video: false })).toEqual({
      uThreshold: 0.1,
      uDecay: 0.9,
      uSource: 0,
    });
  });

  it('never name a uniform after the video it samples', () => {
    expect(Object.keys(uniforms(INITIAL))).not.toContain(Object.keys(TEXTURES)[0]);
  });
});
