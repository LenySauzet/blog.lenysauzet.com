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

export interface ChartProps {
  data: Record<string, unknown>[];
  series: Series[];
  x: Axis;
  y?: { label?: string; min?: number; max?: number; unit?: string };
  type?: 'area' | 'bar' | 'line';
  caption?: ReactNode;
  controls?: ReactNode;
  legend?: boolean;
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
