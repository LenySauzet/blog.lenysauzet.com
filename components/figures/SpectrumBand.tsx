'use client';

import { usePlotArea, useXAxisScale, useYAxisScale } from 'recharts';

export interface SpectrumBandProps {
  /** Wavelengths in nanometres, read on the chart's own x axis. */
  from: number;
  to: number;
  /** Where the band's top sits, read on the y axis rather than in pixels, so
      it keeps its meaning when the domain changes. */
  upTo?: number;
  /** One stop every `step` nm. Finer than the eye needs is wasted markup. */
  step?: number;
  opacity?: number;
}

/**
 * A decoration that lives inside a chart rather than beside it: it reads the
 * x scale the chart already built, so the band lines up with the curve above
 * it by construction and keeps doing so when the data or the width changes.
 *
 * This is the whole extension story for `Chart`. Anything a plot can be
 * annotated with is a component like this one.
 */
export default function SpectrumBand({
  from,
  to,
  upTo = 20,
  step = 5,
  opacity = 0.3,
}: SpectrumBandProps) {
  const scale = useXAxisScale();
  const y = useYAxisScale();
  const plot = usePlotArea();

  if (!scale || !y || !plot) return null;

  const left = scale(from);
  const right = scale(to);
  const top = y(upTo);
  if (typeof left !== 'number' || typeof right !== 'number' || typeof top !== 'number') return null;

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
        y={top}
        height={Math.max(0, plot.y + plot.height - top)}
        fill="url(#spectrum-band)"
        opacity={opacity}
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
