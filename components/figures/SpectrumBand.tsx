'use client';

import { usePlotArea, useXAxisScale } from 'recharts';

export interface SpectrumBandProps {
  /** Wavelengths in nanometres, read on the chart's own x axis. */
  from: number;
  to: number;
  height?: number;
  /** One stop every `step` nm. Finer than the eye needs is wasted markup. */
  step?: number;
}

/**
 * A decoration that lives inside a chart rather than beside it: it reads the
 * x scale the chart already built, so the band lines up with the curve above
 * it by construction and keeps doing so when the data or the width changes.
 *
 * This is the whole extension story for `Chart`. Anything a plot can be
 * annotated with is a component like this one.
 */
export default function SpectrumBand({ from, to, height = 28, step = 5 }: SpectrumBandProps) {
  const scale = useXAxisScale();
  const plot = usePlotArea();

  if (!scale || !plot) return null;

  const left = scale(from);
  const right = scale(to);
  if (typeof left !== 'number' || typeof right !== 'number') return null;

  const stops = [];
  for (let nm = from; nm <= to; nm += step) {
    stops.push(
      <stop key={nm} offset={(nm - from) / (to - from)} stopColor={visibleColour(nm)} />
    );
  }

  return (
    <>
      <defs>
        <linearGradient id="spectrum-band">{stops}</linearGradient>
      </defs>
      <rect
        x={Math.min(left, right)}
        width={Math.abs(right - left)}
        y={plot.y + plot.height - height}
        height={height}
        fill="url(#spectrum-band)"
        opacity={0.55}
      />
    </>
  );
}

/**
 * An approximation of the visible spectrum, not a colorimetric conversion:
 * the band says "this end is blue and that end is red" and nothing finer.
 * Hardcoded on purpose, since a wavelength's colour is a physical fact and
 * does not follow the site's accent.
 */
function visibleColour(nm: number): string {
  if (nm < 440) return `rgb(${(-(nm - 440) / 60) * 255}, 0, 255)`;
  if (nm < 490) return `rgb(0, ${((nm - 440) / 50) * 255}, 255)`;
  if (nm < 510) return `rgb(0, 255, ${(-(nm - 510) / 20) * 255})`;
  if (nm < 580) return `rgb(${((nm - 510) / 70) * 255}, 255, 0)`;
  if (nm < 645) return `rgb(255, ${(-(nm - 645) / 65) * 255}, 0)`;
  return 'rgb(255, 0, 0)';
}
