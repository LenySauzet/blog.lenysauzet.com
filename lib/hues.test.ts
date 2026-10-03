import { describe, expect, it } from 'vitest';

import { accentOf, CHROMA, DEFAULT_HUE, HUES, hueOf, LIGHTNESS, propertiesOf } from './hues';

/**
 * oklch to sRGB, so the contrast floor below is checked rather than asserted.
 * Test-only: nothing ships it, the browser doing this conversion itself.
 * Agrees with Chrome to within 0.02 of a ratio across all eighteen presets.
 */
const luminance = (L: number, C: number, H: number) => {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const long = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const medium = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const short = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  ]
    .map((channel) => Math.min(1, Math.max(0, channel)))
    .map((channel) =>
      channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055
    )
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((total, channel, index) => total + [0.2126, 0.7152, 0.0722][index] * channel, 0);
};

const contrast = (a: number, b: number) => {
  const [bright, dim] = [a, b].sort((x, y) => y - x);

  return (bright + 0.05) / (dim + 0.05);
};

describe('hueOf', () => {
  it('answers the preset a stored id stands for', () => {
    expect(hueOf('teal')).toBe(HUES.find((hue) => hue.id === 'teal'));
  });

  // The id comes out of storage, so it is whatever a reader last left there,
  // an older build wrote, or somebody typed into devtools.
  it('falls back to the default for anything it does not know', () => {
    expect(hueOf('chartreuse')).toBe(DEFAULT_HUE);
    expect(hueOf(null)).toBe(DEFAULT_HUE);
    expect(hueOf(undefined)).toBe(DEFAULT_HUE);
    expect(hueOf('')).toBe(DEFAULT_HUE);
  });
});

describe('HUES', () => {
  it('holds the default, and holds each id, name and angle once', () => {
    expect(HUES).toContain(DEFAULT_HUE);
    expect(new Set(HUES.map((hue) => hue.id)).size).toBe(HUES.length);
    expect(new Set(HUES.map((hue) => hue.label)).size).toBe(HUES.length);
    expect(new Set(HUES.map((hue) => hue.hue)).size).toBe(HUES.length);
  });

  it('names each preset after the hue it actually is', () => {
    // Tailwind's own angles. A preset called Blue that sits at 262 is a violet
    // with a blue's name, which is how the default shipped before.
    const tailwind: Record<string, number> = {
      red: 25.331, orange: 47.604, amber: 70.08, yellow: 86.047, lime: 130.85,
      green: 149.579, emerald: 162.48, teal: 182.503, cyan: 215.221, sky: 237.323,
      blue: 259.815, indigo: 277.117, violet: 292.717, purple: 303.9,
      fuchsia: 322.15, pink: 354.308, rose: 16.439,
    };

    for (const preset of HUES) {
      expect(preset.hue, preset.label).toBeCloseTo(tailwind[preset.id], 2);
    }
  });

  /**
   * Only the hue turns for every other token, and the accent carries far more
   * chroma than any of them, so what a preset costs in contrast is decided by
   * its angle. At a fixed lightness the green and cyan arc falls to 3.17 on
   * white where the warm end reaches 4.06; each preset carries the lightness
   * that buys it back. The floor is what the site shipped before any of this.
   */
  it('clears the floor in both themes, every one of them', () => {
    const onWhite = luminance(1, 0, 0);

    for (const preset of HUES) {
      const accent = luminance(preset.lightness ?? LIGHTNESS, CHROMA, preset.hue);
      const onPage = luminance(0.1468, 0.01, preset.hue);

      expect(contrast(accent, onWhite), `${preset.label} in light`).toBeGreaterThanOrEqual(3.79);
      expect(contrast(accent, onPage), `${preset.label} in dark`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('propertiesOf', () => {
  it('writes the angle and the lightness, the default one included', () => {
    expect(propertiesOf(hueOf('violet'))).toEqual({
      '--base-hue': '292.717',
      '--accent-l': String(LIGHTNESS),
    });
  });

  it('carries the lightness a preset declares', () => {
    expect(propertiesOf(hueOf('teal'))['--accent-l']).toBe('0.565');
  });
});

describe('accentOf', () => {
  it('paints what the preset will apply, not an approximation of it', () => {
    expect(accentOf(hueOf('teal'))).toBe('oklch(0.565 0.168 182.503)');
    expect(accentOf(hueOf('violet'))).toBe('oklch(0.615 0.168 292.717)');
  });
});
