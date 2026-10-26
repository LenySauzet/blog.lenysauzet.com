import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import type { Vec2 } from '@/lib/vec2';

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

export function Line({
  from,
  to,
  tone = 'structure',
  dashed = false,
  width = 2,
}: {
  from: Vec2;
  to: Vec2;
  tone?: Tone;
  dashed?: boolean;
  width?: number;
}) {
  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      strokeWidth={width}
      strokeLinecap="round"
      className={cn(
        TONES[tone],
        'stroke-(--tone)',
        dashed && '[stroke-dasharray:4_6]',
      )}
    />
  );
}

export function Point({
  at,
  tone = 'blue',
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

export function Label({ at, children }: { at: Vec2; children: ReactNode }) {
  return (
    <text
      x={at.x}
      y={at.y}
      textAnchor="middle"
      dominantBaseline="central"
      className="fill-foreground stroke-background stroke-3 [paint-order:stroke] [stroke-linejoin:round]"
    >
      {children}
    </text>
  );
}
