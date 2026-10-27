import { describe, expect, it } from 'vitest';

import { uniforms } from './settings';

describe('the video halftone settings', () => {
  it('reach the shader as a cell in CSS pixels and a radius', () => {
    expect(uniforms(32, 0.4)).toEqual({ uPixelSize: 32, uRadius: 0.4 });
  });
});
