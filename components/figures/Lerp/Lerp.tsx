'use client';

import Figure from '@/components/Figure';
import Diagram, {
  Label,
  Line,
  Playback,
  Point,
  Readout,
  useTimeline,
} from '@/components/figures/Diagram';

import { HEIGHT, INITIAL, interpolation, PERIOD, READOUT } from './geometry';

export interface LerpProps {
  className?: string;
}

export default function Lerp({ className }: LerpProps) {
  const { ref, phase, playing, toggle } = useTimeline(PERIOD, INITIAL);
  const { t, from, to, point, labels } = interpolation(phase);

  return (
    <Figure
      className={className}
      caption="Linear interpolation moves a point the fraction t of the way from P0 to P1. Every blend in graphics is this one move, applied to positions, colours or anything else that adds and scales.">
      <Diagram ref={ref} height={HEIGHT} title="A point interpolated from P0 to P1">
        <Line from={point} to={to} tone="ink" width={1.5} dashed />
        <Line from={from} to={point} tone="ink" width={3} />
        <Point at={from} />
        <Point at={to} />
        <Point at={point} r={6} />

        {Object.entries(labels).map(([name, placement]) => (
          <Label key={name} {...placement}>
            {name}
          </Label>
        ))}
        <Readout at={READOUT} name="t" value={t} />
      </Diagram>

      <Playback playing={playing} onToggle={toggle} />
    </Figure>
  );
}
