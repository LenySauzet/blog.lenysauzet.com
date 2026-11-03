import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  accentOf,
  arc,
  CHROMA,
  companionsOf,
  DEFAULT_HUE,
  HUES,
  hueOf,
  INK_ON_WASH,
  LIGHT_SHIFT,
  LIGHTNESS,
  propertiesOf,
} from './hues';

/**
 * oklch to sRGB, so the contrast floor below is checked rather than asserted.
 * Test-only: nothing ships it, the browser doing this conversion itself.
 * Agrees with Chrome to within 0.02 of a ratio across all eighteen presets.
 */
const encoded = (L: number, C: number, H: number) => {
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
    );
};

/** From sRGB as encoded, the form a wash is composited in. */
const relative = (rgb: number[]) =>
  rgb
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((total, channel, index) => total + [0.2126, 0.7152, 0.0722][index] * channel, 0);

const luminance = (L: number, C: number, H: number) => relative(encoded(L, C, H));

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
   * that buys it back, and on white it sits LIGHT_SHIFT darker again, the
   * accent being read as text: links, a badge, a button's label on it.
   */
  it('reads as text in both themes, every one of them', () => {
    const onWhite = luminance(1, 0, 0);

    for (const preset of HUES) {
      const lightness = preset.lightness ?? LIGHTNESS;
      const onLight = luminance(lightness - LIGHT_SHIFT, CHROMA, preset.hue);
      const onDark = luminance(lightness, CHROMA, preset.hue);
      const card = luminance(0.98, 0.004, preset.hue);
      const page = luminance(0.1468, 0.01, preset.hue);

      expect(contrast(onLight, onWhite), `${preset.label} in light`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(onLight, card), `${preset.label} on a light card`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(onDark, page), `${preset.label} in dark`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('the stylesheet', () => {
  const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');

  // It cannot import the constants, so it is checked against what was written there.
  it('shifts the accent on the light page alone, by LIGHT_SHIFT', () => {
    expect(css).toContain(`--accent-shift: ${LIGHT_SHIFT};`);
    expect(css).toMatch(/\.dark \{[^}]*--accent-shift: 0;/);
    expect(css.match(/--primary: oklch\(calc\(var\(--accent-l, 0\.615\) - var\(--accent-shift\)\)/g)).toHaveLength(1);
  });

  it('caps the ink of small text on its own wash at INK_ON_WASH', () => {
    expect(css).toContain(`color: oklch(from --value(--color-*) min(l, ${INK_ON_WASH}) c h);`);
  });
});

describe('INK_ON_WASH', () => {
  /**
   * A badge writes its colour on a wash of the same colour, 15% at its darkest, a
   * hover; the shifted accent alone reads near 4.0 there. Capped, it clears 4.5 on the
   * light page and on a card under every preset, and so do the status colours.
   */
  it('reads at 4.5:1 over its own wash, every preset and status colour', () => {
    const colours: [string, number, number, number][] = [
      ...HUES.map((preset): [string, number, number, number] => [
        preset.label, (preset.lightness ?? LIGHTNESS) - LIGHT_SHIFT, CHROMA, preset.hue,
      ]),
      ['success', 0.5284, 0.117, 170],
      ['warning', 0.7412, 0.181, 60],
      ['destructive', 0.644, 0.204, 21.9],
    ];

    for (const [label, L, C, H] of colours) {
      const ink = relative(encoded(Math.min(L, INK_ON_WASH), C, H));
      for (const [surface, ground] of [['page', encoded(1, 0, 0)], ['card', encoded(0.98, 0.004, H)]] as const) {
        const wash = encoded(L, C, H).map((channel, index) => 0.15 * channel + 0.85 * ground[index]);
        expect(contrast(ink, relative(wash)), `${label} on a ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe('companionsOf', () => {
  it('keeps the accent and both companions well apart, whichever the preset', () => {
    for (const preset of HUES) {
      const { second, third } = companionsOf(preset);
      const angles = [preset.hue, second.hue, third.hue];

      for (const [i, a] of angles.entries())
        for (const b of angles.slice(i + 1))
          expect(arc(a, b), preset.label).toBeGreaterThanOrEqual(70);
    }
  });

  it('reads as a mark against the page in both themes', () => {
    const onWhite = luminance(1, 0, 0);

    for (const preset of HUES) {
      const onPage = luminance(0.1468, 0.01, preset.hue);

      for (const { light, dark } of Object.values(companionsOf(preset))) {
        expect(contrast(luminance(...light), onWhite), `${preset.label} in light`).toBeGreaterThanOrEqual(3);
        expect(contrast(luminance(...dark), onPage), `${preset.label} in dark`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('is applied with the preset, one colour per theme', () => {
    expect(propertiesOf(hueOf('blue'))).toMatchObject({
      '--second-light': 'oklch(0.646 0.222 41.116)',
      '--second-dark': 'oklch(0.75 0.183 55.934)',
      '--third-light': 'oklch(0.596 0.145 163.225)',
      '--third-dark': 'oklch(0.765 0.177 163.223)',
    });
  });
});

describe('propertiesOf', () => {
  it('writes the angle and the lightness, the default one included', () => {
    expect(propertiesOf(hueOf('violet'))).toMatchObject({
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
    expect(accentOf(hueOf('teal'))).toBe('oklch(calc(0.565 - var(--accent-shift, 0)) 0.168 182.503)');
    expect(accentOf(hueOf('violet'))).toBe('oklch(calc(0.615 - var(--accent-shift, 0)) 0.168 292.717)');
  });
});
