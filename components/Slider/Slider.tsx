'use client';

import { useState } from 'react';

import { Slider as SliderRoot } from '@/components/ui/slider';

export interface SliderProps
  extends Omit<
    React.ComponentProps<typeof SliderRoot>,
    'value' | 'defaultValue' | 'onValueChange'
  > {
  /** Named inside the bar, on the left. */
  label: string;
  defaultValue?: number;
  /** Appended to the readout, e.g. `%` or `px`. */
  unit?: string;
  decimals?: number;
}

/**
 * The label and readout sit over the bar rather than inside the control, so a
 * disabled slider fades its own surface without taking its caption with it.
 *
 * The readout is described by data, not by a formatter callback: a post is a
 * Server Component, and React cannot hand a function across that boundary.
 */
export default function Slider({
  label,
  defaultValue = 50,
  unit = '',
  decimals = 0,
  className,
  ...props
}: SliderProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className={className}>
      <div className="relative">
        <SliderRoot
          value={[value]}
          onValueChange={([next]) => setValue(next)}
          aria-label={label}
          {...props}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-4 font-display text-xs text-muted-foreground">
          <span className="font-medium">{label}</span>
          <span className="tabular-nums">
            {value.toFixed(decimals)}
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
}
