import { add, normalize, scale, sub, type Vec2 } from '@/lib/vec2';
import { cn } from '@/lib/utils';

import { TONES, type Tone } from './tones';

interface Marked {
  tone?: Tone;
  className?: string;
}

const points = (list: readonly Vec2[]) =>
  list.map(({ x, y }) => `${x},${y}`).join(' ');

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
  className,
}: Marked & { at: Vec2; r: number; fill?: keyof typeof FILLS }) {
  return (
    <circle
      cx={at.x}
      cy={at.y}
      r={r}
      className={cn(
        TONES[tone],
        'stroke-(--tone) stroke-2',
        FILLS[fill],
        className,
      )}
    />
  );
}

export function Line({
  from,
  to,
  tone = 'structure',
  dashed = false,
  width = 2,
  className,
}: Marked & { from: Vec2; to: Vec2; dashed?: boolean; width?: number }) {
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
        className,
      )}
    />
  );
}

/** A place on the drawing worth naming, and its name. */
export function Point({
  at,
  label,
  tone = 'blue',
  r = 5,
  /** Where the name sits relative to the dot, in the figure's own units. */
  offset = { x: 0, y: -14 },
  className,
}: Marked & { at: Vec2; label?: string; r?: number; offset?: Vec2 }) {
  return (
    <g className={cn(TONES[tone], className)}>
      <circle cx={at.x} cy={at.y} r={r} className="fill-(--tone)" />
      {label ? (
        <text
          x={at.x + offset.x}
          y={at.y + offset.y}
          textAnchor="middle"
          className="fill-foreground"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

const HEAD_LENGTH = 11;
const HEAD_HALF_WIDTH = 4;

/**
 * Names something the drawing cannot label in place: the arrow lands on the
 * subject and the word sits clear of it.
 *
 * The head is a polygon rather than a `marker`, which would need the SVG 2
 * `context-stroke` to take the tone with it and paints black where that is not
 * understood. The anchor follows the direction of travel, so a leader reaching
 * left never sets its text across the thing it points at.
 */
export function Leader({
  at,
  from,
  label,
  tone = 'structure',
  className,
}: Marked & { at: Vec2; from: Vec2; label: string }) {
  const direction = normalize(sub(at, from));
  const base = sub(at, scale(direction, HEAD_LENGTH));
  const side = scale({ x: -direction.y, y: direction.x }, HEAD_HALF_WIDTH);
  const reachesRight = direction.x < 0;

  return (
    <g className={cn(TONES[tone], className)}>
      <line
        x1={from.x}
        y1={from.y}
        x2={base.x}
        y2={base.y}
        strokeWidth={1.5}
        className="stroke-(--tone)"
      />
      <polygon
        points={points([at, add(base, side), sub(base, side)])}
        className="fill-(--tone)"
      />
      <text
        x={from.x + (reachesRight ? 6 : -6)}
        y={from.y}
        dominantBaseline="middle"
        textAnchor={reachesRight ? 'start' : 'end'}
        className="fill-foreground"
      >
        {label}
      </text>
    </g>
  );
}
