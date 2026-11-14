import { describe, expect, it } from 'vitest';

import { themeOf } from './stored-theme';

describe('themeOf', () => {
  it('keeps an explicit choice whatever the system prefers', () => {
    expect(themeOf('light', false)).toBe('light');
    expect(themeOf('dark', true)).toBe('dark');
  });

  it('follows the system only when asked to', () => {
    expect(themeOf('system', true)).toBe('light');
    expect(themeOf('system', false)).toBe('dark');
  });

  it('falls back to dark, the site default, for nothing stored or anything unknown', () => {
    expect(themeOf(null, true)).toBe('dark');
    expect(themeOf('sepia', true)).toBe('dark');
  });
});
