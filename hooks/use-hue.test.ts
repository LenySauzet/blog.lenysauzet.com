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

  // A preview paints over the committed accent and must leave no trace of
  // itself: a reader who looks at six colours and picks none keeps the one
  // they arrived with.
  it('paints a preview without committing it', () => {
    useHue.getState().apply('teal');

    expect(painted()).toBe(String(hueOf('teal').hue));
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(useHue.getState().hue).toBe(DEFAULT_HUE.id);
  });

  it('paints and remembers what is actually chosen', () => {
    useHue.getState().setHue('rose');

    expect(painted()).toBe(String(hueOf('rose').hue));
    expect(localStorage.getItem(STORAGE_KEY)).toBe('rose');
    expect(useHue.getState().hue).toBe('rose');
  });

  it('writes the lightness and chroma a preset carries', () => {
    useHue.getState().setHue('neutral');

    expect(document.documentElement.style.getPropertyValue('--accent-c')).toBe('0');
    expect(document.documentElement.style.getPropertyValue('--accent-l')).toBe('0.61');
  });

  it('paints the default rather than nothing for an id it does not know', () => {
    useHue.getState().apply('chartreuse');

    expect(painted()).toBe(String(DEFAULT_HUE.hue));
  });
});
