import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import type { Vec2 } from '@/lib/vec2';

import { leaderPath } from './leaders';
import { TONES, type Tone } from './tones';

const FILLS = {
  none: 'fill-none',
  soft: 'fill-(--tone)/12',
  solid: 'fill-(--tone)/25',
} as const;

export function Circle({
  at,
  r,
  tone = 'structure',
  fill = 'none',
}: {
  at: Vec2;
  r: number;
  tone?: Tone;
  fill?: keyof typeof FILLS;
}) {
  return (
    <circle
      cx={at.x}
      cy={at.y}
      r={r}
      className={cn(TONES[tone], 'stroke-(--tone) stroke-2', FILLS[fill])}
    />
  );
}

interface Stroke {
  tone?: Tone;
  dashed?: boolean;
  width?: number;
}

const stroke = ({ tone = 'structure', dashed = false, width = 2 }: Stroke) => ({
  strokeWidth: width,
  strokeLinecap: 'round' as const,
  className: cn(
    TONES[tone],
    'fill-none stroke-(--tone)',
    dashed && '[stroke-dasharray:4_6]',
  ),
});

export function Line({ from, to, ...rest }: Stroke & { from: Vec2; to: Vec2 }) {
  return (
    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} {...stroke(rest)} />
  );
}

export function Curve({
  points: [start, a, b, end],
  ...rest
}: Stroke & { points: readonly [Vec2, Vec2, Vec2, Vec2] }) {
  return (
    <path
      d={`M${start.x},${start.y} C${a.x},${a.y} ${b.x},${b.y} ${end.x},${end.y}`}
      {...stroke(rest)}
    />
  );
}

export function Point({
  at,
  tone = 'ink',
  r = 5,
}: {
  at: Vec2;
  tone?: Tone;
  r?: number;
}) {
  return (
    <circle
      cx={at.x}
      cy={at.y}
      r={r}
      className={cn(TONES[tone], 'fill-(--tone)')}
    />
  );
}

export interface Placement {
  at: Vec2;
  offset: Vec2;
}

export function Label({
  at,
  offset,
  children,
}: Placement & { children: ReactNode }) {
  return (
    <text
      x={at.x}
      y={at.y}
      dx={`${offset.x}em`}
      dy={`${offset.y}em`}
      textAnchor="middle"
      dominantBaseline="central"
      className="fill-foreground stroke-background stroke-3 [paint-order:stroke] [stroke-linejoin:round]"
    >
      {children}
    </text>
  );
}

export function Leader({
  target,
  label,
  children,
}: {
  target: Vec2;
  label: Vec2;
  children: ReactNode;
}) {
  const rightward = label.x > target.x;

  return (
    <g className={TONES.structure}>
      <polyline
        points={leaderPath(target, label)
          .map(({ x, y }) => `${x},${y}`)
          .join(' ')}
        className="fill-none stroke-(--tone)"
      />
      <text
        x={label.x}
        y={label.y}
        dx={rightward ? '0.5em' : '-0.5em'}
        textAnchor={rightward ? 'start' : 'end'}
        dominantBaseline="central"
        className="fill-foreground"
      >
        {children}
      </text>
    </g>
  );
}
