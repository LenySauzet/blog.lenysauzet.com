import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { hueOf, STORAGE_KEY } from '@/lib/theme/hues';

import { StoredHue } from './StoredHue';

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('style');
});

describe('StoredHue', () => {
  it('paints the stored accent when the layout mounts, as after a retry', () => {
    localStorage.setItem(STORAGE_KEY, 'rose');

    render(<StoredHue />);

    expect(document.documentElement.style.getPropertyValue('--base-hue')).toBe(String(hueOf('rose').hue));
  });
});
