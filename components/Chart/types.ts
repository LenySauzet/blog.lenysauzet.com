import type { ReactNode } from "react";

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

/** The value axis, which names no key: it reads whatever the series hold. */
export interface Scale {
  label?: string;
  unit?: string;
  min?: number;
  max?: number;
}

export interface ChartProps {
  data: Record<string, unknown>[];
  series: Series[];
  x: Axis;
  y?: Scale;
  type?: "area" | "bar" | "line";
  /**
   * How an area is filled. Recharts has no gradient prop, so shadcn's own
   * "gradient" example is markup a caller copies; owning the marks turns it
   * into a word here.
   */
  fill?: "gradient" | "flat";
  caption?: ReactNode;
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
  /** A hole in the middle, which keeps the slices comparable by angle alone. */
  donut?: boolean;
  legend?: boolean;
}

export interface PolarProps {
  data: Record<string, unknown>[];
  series: Series[];
  /** The key naming each spoke. */
  axis: string;
  caption?: ReactNode;
  legend?: boolean;
}

export interface RadialProps {
  data: Slice[];
  caption?: ReactNode;
  legend?: boolean;
  /** The full turn, against which every arc is read. */
  max?: number;
}
