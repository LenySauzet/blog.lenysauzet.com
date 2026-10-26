import { useId, type ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { add, normalize, scale, sub, vec2, type Vec2 } from '@/lib/vec2';

import { LEADER_GAP, leaderPath } from './leaders';
import { tangents, type Disc } from './magnifier';
import { TONES, type Tone } from './tones';

interface Stroke {
  tone?: Tone;
  dashed?: boolean;
  width?: number;
  className?: string;
}

const stroke = ({
  tone = 'structure',
  dashed = false,
  width = 2,
  className,
}: Stroke) => ({
  strokeWidth: width,
  strokeLinecap: 'round' as const,
  className: cn(
    TONES[tone],
    'stroke-(--tone)',
    dashed && '[stroke-dasharray:4_6]',
    className,
  ),
});

const FILLS = {
  none: 'fill-none',
  soft: 'fill-(--tone)/12',
  solid: 'fill-(--tone)/25',
  hatched: '',
} as const;

type Fill = keyof typeof FILLS | number;

const HATCH = 6;

function useFill(tone: Tone, fill: Fill) {
  const hatch = useId();

  if (typeof fill === 'number') {
    return { className: 'fill-(--tone)', fillOpacity: fill };
  }

  if (fill !== 'hatched') return { className: FILLS[fill] };

  return {
    fill: `url(#${hatch})`,
    pattern: (
      <pattern
        id={hatch}
        width={HATCH}
        height={HATCH}
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <line y2={HATCH} className={cn(TONES[tone], 'stroke-(--tone)')} />
      </pattern>
    ),
  };
}

type Shape = Stroke & { fill?: Fill };

function useShape({ fill = 'none', ...rest }: Shape) {
  const { pattern, className, ...paint } = useFill(rest.tone ?? 'structure', fill);
  const outline = stroke(rest);

  return {
    pattern,
    paint: { ...outline, ...paint, className: cn(className, outline.className) },
  };
}

const points = (list: readonly Vec2[]) =>
  list.map(({ x, y }) => `${x},${y}`).join(' ');

export function Circle({ at, r, ...shape }: Shape & { at: Vec2; r: number }) {
  const { pattern, paint } = useShape(shape);

  return (
    <>
      {pattern}
      <circle cx={at.x} cy={at.y} r={r} {...paint} />
    </>
  );
}

export function Polygon({
  corners,
  ...shape
}: Shape & { corners: readonly Vec2[] }) {
  const { pattern, paint } = useShape(shape);

  return (
    <>
      {pattern}
      <polygon points={points(corners)} {...paint} />
    </>
  );
}

export function Line({ from, to, ...rest }: Stroke & { from: Vec2; to: Vec2 }) {
  return (
    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} {...stroke(rest)} />
  );
}

export function Curve({
  points: [start, a, b, end],
  ...rest
}: Stroke & { points: readonly [Vec2, Vec2, Vec2, Vec2] }) {
  const outline = stroke(rest);

  return (
    <path
      d={`M${start.x},${start.y} C${a.x},${a.y} ${b.x},${b.y} ${end.x},${end.y}`}
      {...outline}
      className={cn(outline.className, 'fill-none')}
    />
  );
}

const HEAD = { length: 9, half: 3.5 };

export function Arrow({
  from,
  to,
  className,
  ...rest
}: Stroke & { from: Vec2; to: Vec2 }) {
  const back = normalize(sub(from, to));
  const base = add(to, scale(back, HEAD.length));
  const side = scale(vec2(-back.y, back.x), HEAD.half);

  return (
    <g className={className}>
      <line x1={from.x} y1={from.y} x2={base.x} y2={base.y} {...stroke(rest)} />
      <polygon
        points={points([to, add(base, side), sub(base, side)])}
        className={cn(TONES[rest.tone ?? 'structure'], 'fill-(--tone)')}
      />
    </g>
  );
}

export function Point({
  at,
  tone = 'ink',
  r = 5,
  className,
}: {
  at: Vec2;
  tone?: Tone;
  r?: number;
  className?: string;
}) {
  return (
    <circle
      cx={at.x}
      cy={at.y}
      r={r}
      className={cn(TONES[tone], 'fill-(--tone)', className)}
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
  className,
  children,
}: Placement & { className?: string; children: ReactNode }) {
  return (
    <text
      x={at.x}
      y={at.y}
      dx={`${offset.x}em`}
      dy={`${offset.y}em`}
      textAnchor="middle"
      dominantBaseline="central"
      className={cn(
        'fill-foreground stroke-background stroke-3 [paint-order:stroke] [stroke-linejoin:round]',
        className,
      )}
    >
      {children}
    </text>
  );
}

export function Leader({
  target,
  label,
  className,
  children,
}: {
  target: Vec2;
  label: Vec2;
  className?: string;
  children: ReactNode;
}) {
  const rightward = label.x > target.x;

  return (
    <g className={cn(TONES.structure, className)}>
      <polyline
        points={points(leaderPath(target, label))}
        className="fill-none stroke-(--tone)"
      />
      <text
        x={label.x}
        y={label.y}
        dx={`${rightward ? LEADER_GAP : -LEADER_GAP}em`}
        textAnchor={rightward ? 'start' : 'end'}
        dominantBaseline="central"
        className="fill-foreground"
      >
        {children}
      </text>
    </g>
  );
}

interface LensProps {
  source: Disc;
  lens: Disc;
  className?: string;
  children: ReactNode;
}

function Lens({
  source,
  lens,
  transform,
  className,
  children,
}: LensProps & { transform: string }) {
  const clip = useId();
  const edge = 'fill-none stroke-(--tone)';

  return (
    <g className={cn(TONES.structure, className)}>
      {tangents(source, lens).map(([near, far], index) => (
        <line
          key={index}
          x1={near.x}
          y1={near.y}
          x2={far.x}
          y2={far.y}
          className={edge}
        />
      ))}
      <circle cx={source.at.x} cy={source.at.y} r={source.r} className={edge} />
      <clipPath id={clip}>
        <circle cx={lens.at.x} cy={lens.at.y} r={lens.r} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <circle cx={lens.at.x} cy={lens.at.y} r={lens.r} className="fill-background" />
        <g transform={transform}>{children}</g>
      </g>
      <circle cx={lens.at.x} cy={lens.at.y} r={lens.r} className={edge} />
    </g>
  );
}

export function Magnifier(props: LensProps) {
  const { source, lens } = props;
  const zoom = lens.r / source.r;

  return (
    <Lens
      {...props}
      transform={`translate(${lens.at.x} ${lens.at.y}) scale(${zoom}) translate(${-source.at.x} ${-source.at.y})`}
    />
  );
}

export function Detail(props: LensProps) {
  return <Lens {...props} transform={`translate(${props.lens.at.x} ${props.lens.at.y})`} />;
}
