import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_HUE, hueOf, STORAGE_KEY } from '@/lib/hues';

import { useHue } from './use-hue';

const painted = () => document.documentElement.style.getPropertyValue('--base-hue');

describe('useHue', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('style');
    useHue.setState({ hue: DEFAULT_HUE.id });
  });

  it('paints and remembers what is actually chosen', () => {
    useHue.getState().setHue('rose');

    expect(painted()).toBe(String(hueOf('rose').hue));
    expect(localStorage.getItem(STORAGE_KEY)).toBe('rose');
    expect(useHue.getState().hue).toBe('rose');
  });

  it('writes the lightness a preset carries', () => {
    useHue.getState().setHue('teal');

    expect(document.documentElement.style.getPropertyValue('--accent-l')).toBe('0.565');
  });

  it('paints the default rather than nothing for an id it does not know', () => {
    useHue.getState().setHue('chartreuse');

    expect(painted()).toBe(String(DEFAULT_HUE.hue));
  });
});
