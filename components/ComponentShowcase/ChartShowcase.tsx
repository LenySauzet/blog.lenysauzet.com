'use client';

import { useState } from 'react';

import Chart, { PieChart, RadarChart, RadialChart, type ChartProps } from '@/components/Chart';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const frameTimes = [
  { size: '256', webgl: 1.4, canvas: 4.1 },
  { size: '512', webgl: 2.1, canvas: 6.8 },
  { size: '1024', webgl: 3.8, canvas: 11.2 },
  { size: '2048', webgl: 7.2, canvas: 18.5 },
  { size: '4096', webgl: 15.9, canvas: 29.4 },
];

const cartesian: Pick<ChartProps, 'data' | 'series' | 'x' | 'y'> = {
  data: frameTimes,
  series: [
    { key: 'webgl', label: 'WebGL' },
    { key: 'canvas', label: 'Canvas 2D' },
  ],
  x: { key: 'size', label: 'Texture size (px)' },
  y: { label: 'Frame time (ms)', unit: ' ms' },
};

const KINDS = {
  Area: (
    <Chart
      {...cartesian}
      caption="An area reads as a quantity over a progression, and fills with a gradient by default."
    />
  ),
  Bar: (
    <Chart
      {...cartesian}
      type="bar"
      caption="Bars compare discrete things, so the x axis is a set of names rather than a scale."
    />
  ),
  Line: (
    <Chart
      {...cartesian}
      type="line"
      caption="A line keeps the shape of a trend without claiming the area underneath means anything."
    />
  ),
  Pie: (
    <PieChart
      data={[
        { key: 'shaders', label: 'Shaders', value: 42 },
        { key: 'react', label: 'React', value: 28 },
        { key: 'maths', label: 'Maths', value: 18 },
        { key: 'other', label: 'Other', value: 12 },
      ]}
      caption="Parts of a whole. The hole keeps the slices comparable by angle alone."
    />
  ),
  Radar: (
    <RadarChart
      axis="axis"
      data={[
        { axis: 'Shaders', before: 58, after: 86 },
        { axis: 'React', before: 74, after: 81 },
        { axis: 'Maths', before: 41, after: 62 },
        { axis: 'WebGL', before: 55, after: 92 },
        { axis: 'Tooling', before: 68, after: 70 },
      ]}
      series={[
        { key: 'before', label: 'Before' },
        { key: 'after', label: 'After' },
      ]}
      caption="Two profiles across the same axes. It compares shapes, so the axes have to be commensurate."
    />
  ),
  Radial: (
    <RadialChart
      data={[
        { key: 'parsed', label: 'Parsed', value: 86 },
        { key: 'shaded', label: 'Shaded', value: 61 },
        { key: 'cached', label: 'Cached', value: 34 },
      ]}
      caption="Arcs of a common track, which reads as a set of gauges: unlike a pie they need not sum to anything."
    />
  ),
};

type Kind = keyof typeof KINDS;
const NAMES = Object.keys(KINDS) as Kind[];

/**
 * Every chart kind the wrapper supports, one at a time. A page showing six at
 * once teaches less than one a reader picks: the frame, the legend and the
 * tooltip are shared, so what the selector actually shows is which shapes the
 * same props can take.
 */
export default function ChartShowcase() {
  const [kind, setKind] = useState<Kind>('Area');

  return (
    <div className="my-6 flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:max-w-56">
        <Label htmlFor="chart-kind">Chart</Label>
        <Select value={kind} onValueChange={(next) => setKind(next as Kind)}>
          <SelectTrigger id="chart-kind" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NAMES.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Keyed, so switching kind mounts a new chart rather than reusing the
          old one's marks: Recharts would otherwise animate from the previous
          shape toward an unrelated one. */}
      <div key={kind}>{KINDS[kind]}</div>
    </div>
  );
}
