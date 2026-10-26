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

const fixed = (value: number, places = 2) => {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
};

function useFill(tone: Tone, fill: Fill) {
  const hatch = useId();

  if (typeof fill === 'number') {
    return { className: 'fill-(--tone)', fillOpacity: fixed(fill, 3) };
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
  list.map(({ x, y }) => `${fixed(x)},${fixed(y)}`).join(' ');

export function Circle({ at, r, ...shape }: Shape & { at: Vec2; r: number }) {
  const { pattern, paint } = useShape(shape);

  return (
    <>
      {pattern}
      <circle cx={fixed(at.x)} cy={fixed(at.y)} r={r} {...paint} />
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
    <line x1={fixed(from.x)} y1={fixed(from.y)} x2={fixed(to.x)} y2={fixed(to.y)} {...stroke(rest)} />
  );
}

export function Curve({
  points: [start, a, b, end],
  ...rest
}: Stroke & { points: readonly [Vec2, Vec2, Vec2, Vec2] }) {
  const outline = stroke(rest);

  return (
    <path
      d={`M${fixed(start.x)},${fixed(start.y)} C${fixed(a.x)},${fixed(a.y)} ${fixed(b.x)},${fixed(b.y)} ${fixed(end.x)},${fixed(end.y)}`}
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
      <line x1={fixed(from.x)} y1={fixed(from.y)} x2={fixed(base.x)} y2={fixed(base.y)} {...stroke(rest)} />
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
      cx={fixed(at.x)}
      cy={fixed(at.y)}
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
      x={fixed(at.x)}
      y={fixed(at.y)}
      dx={`${fixed(offset.x)}em`}
      dy={`${fixed(offset.y)}em`}
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
        x={fixed(label.x)}
        y={fixed(label.y)}
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
          x1={fixed(near.x)}
          y1={fixed(near.y)}
          x2={fixed(far.x)}
          y2={fixed(far.y)}
          className={edge}
        />
      ))}
      <circle cx={fixed(source.at.x)} cy={fixed(source.at.y)} r={source.r} className={edge} />
      <clipPath id={clip}>
        <circle cx={fixed(lens.at.x)} cy={fixed(lens.at.y)} r={lens.r} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <circle cx={fixed(lens.at.x)} cy={fixed(lens.at.y)} r={lens.r} className="fill-background" />
        <g transform={transform}>{children}</g>
      </g>
      <circle cx={fixed(lens.at.x)} cy={fixed(lens.at.y)} r={lens.r} className={edge} />
    </g>
  );
}

export function Magnifier(props: LensProps) {
  const { source, lens } = props;
  const zoom = lens.r / source.r;

  return (
    <Lens
      {...props}
      transform={`translate(${fixed(lens.at.x)} ${fixed(lens.at.y)}) scale(${fixed(zoom, 4)}) translate(${fixed(-source.at.x)} ${fixed(-source.at.y)})`}
    />
  );
}

export function Detail(props: LensProps) {
  return <Lens {...props} transform={`translate(${fixed(props.lens.at.x)} ${fixed(props.lens.at.y)})`} />;
}
