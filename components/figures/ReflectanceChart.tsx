'use client';

import { useMemo } from 'react';

import Chart from '@/components/Chart';

import SpectrumBand from './SpectrumBand';
import { spectrum } from './reflectance';

/**
 * Three additive primaries and what they come to together.
 *
 * **The series are the pure sRGB primaries**, not approximations of them in
 * the site's colour space: the result is their additive sum, and summing
 * anything else gives a wash rather than white. That is the one place a
 * figure's colours are physics instead of design.
 */
const SERIES = [
  { key: 'red', label: 'Red', color: 'rgb(255 0 0)' },
  { key: 'green', label: 'Green', color: 'rgb(0 255 0)' },
  { key: 'blue', label: 'Blue', color: 'rgb(0 0 255)' },
];

export default function ReflectanceChart() {
  const data = useMemo(() => spectrum(), []);

  return (
    <Chart
      type="line"
      data={data}
      series={SERIES}
      x={{ key: 'nm', label: 'Wavelength (nm)', unit: 'nm' }}
      y={{ label: 'Reflectance (%)', min: 0, max: 100, unit: '%' }}
      derived={{
        key: 'result',
        label: 'Result',
        color: 'additive',
        combine: 'sum',
        max: 100,
      }}
      caption="Light adds, so the result is the sum of the channels still on, and it wears the colour that sum would be."
    >
      <SpectrumBand from={400} to={700} />
    </Chart>
  );
}
