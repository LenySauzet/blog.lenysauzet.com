import type { ReactNode } from 'react';

export interface Series {
  /** The key this series reads out of each datum. */
  key: string;
  label: string;
  /** Overrides the chart token this series would otherwise take. */
  color?: string;
}

export interface Axis {
  key: string;
  label?: string;
  /** Appended to the tooltip's heading, e.g. `nm`. */
  unit?: string;
}

export interface Derived {
  key: string;
  label: string;
  /**
   * `'additive'` adds the visible series' own colours channel-wise, so a sum
   * of light looks like the light it sums: red and blue give magenta, all
   * three give white. Anything else is taken as a colour.
   */
  color?: string | 'additive';
  /**
   * Named rather than handed in as a callback: a post is a Server Component,
   * and React cannot pass a function across that boundary. `components/Slider`
   * learned this first, which is why its readout takes `unit` and `decimals`.
   */
  combine: 'sum' | 'max' | 'min' | 'mean';
  /** Ceiling for the result, e.g. 100 for a percentage that cannot exceed full. */
  max?: number;
  /**
   * How many series must be visible before it is drawn at all. Below two it
   * lies exactly on the one series it combines, which reads as a rendering
   * fault rather than as a result.
   */
  from?: number;
}

export interface ChartProps {
  data: Record<string, unknown>[];
  series: Series[];
  x: Axis;
  y?: { label?: string; min?: number; max?: number; unit?: string };
  type?: 'area' | 'bar' | 'line';
  /**
   * How an area is filled. Recharts has no gradient prop, so shadcn's own
   * "gradient" example is markup a caller copies; owning the marks turns it
   * into a word here.
   */
  fill?: 'gradient' | 'flat';
  caption?: ReactNode;
  controls?: ReactNode;
  legend?: boolean;
  /**
   * A series computed from whichever others are visible, recomputed as the
   * legend is used. It carries the reader's question when the chart is about
   * how the parts add up rather than about any one of them.
   */
  derived?: Derived;
  /** Drawn inside the plot, in its coordinate space. */
  children?: ReactNode;
}

export interface Slice {
  key: string;
  label: string;
  value: number;
  color?: string;
}

export interface PieProps {
  data: Slice[];
  caption?: ReactNode;
  controls?: ReactNode;
  /** A hole in the middle, which keeps the slices comparable by angle alone. */
  donut?: boolean;
  legend?: boolean;
}
