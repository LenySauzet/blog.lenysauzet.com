import type { ReactNode } from "react";

export interface Series {
  /** Read out of each datum. */
  key: string;
  label: string;
  /** Overrides the chart token. */
  color?: string;
}

export interface Axis {
  key: string;
  label?: string;
  /** Appended to the tooltip's heading, e.g. `nm`. */
  unit?: string;
}

/** The value axis: it reads whatever the series hold. */
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
  /** The value of a full turn. */
  max?: number;
}
