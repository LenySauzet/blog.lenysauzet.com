import { useId, type ReactNode } from 'react';

import { centre, type Rect } from '@/lib/rect';
import { cn } from '@/lib/utils';
import { add, normalize, scale, sub, vec2, type Vec2 } from '@/lib/vec2';


import { LEADER_GAP, leaderPath } from './leaders';
import { tangents, type Disc } from './magnifier';
import { paint, type Tone } from './tones';

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
  style: paint(tone),
  className: cn(
    'stroke-(--edge)',
    dashed && '[stroke-dasharray:4_6]',
    className,
  ),
});

const FILLS = {
  none: 'fill-none',
  soft: 'fill-(--fill)/12',
  solid: 'fill-(--fill)/25',
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
    return { className: 'fill-(--fill)', fillOpacity: fixed(fill, 3) };
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
        <line y2={HATCH} style={paint(tone)} className="stroke-(--edge)" />
      </pattern>
    ),
  };
}

type Shape = Stroke & { fill?: Fill; outline?: Tone };

function useShape({ fill = 'none', outline, ...rest }: Shape) {
  const tone = rest.tone ?? 'structure';
  const { pattern, className, ...surface } = useFill(tone, fill);
  const edge = stroke(rest);

  return {
    pattern,
    paint: {
      ...edge,
      ...surface,
      style: paint(tone, outline ?? tone),
      className: cn(className, edge.className),
    },
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

export function Rectangle({
  box: { corner, size },
  ...shape
}: Shape & { box: Rect }) {
  const { pattern, paint } = useShape(shape);

  return (
    <>
      {pattern}
      <rect
        x={fixed(corner.x)}
        y={fixed(corner.y)}
        width={fixed(size.x)}
        height={fixed(size.y)}
        {...paint}
      />
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
        style={paint(rest.tone ?? 'structure')}
        className="fill-(--fill)"
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
      style={paint(tone)}
      className={cn('fill-(--fill)', className)}
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

export function Title({
  at,
  offset = vec2(0, 0),
  anchor = 'middle',
  className,
  children,
}: {
  at: Vec2;
  offset?: Vec2;
  anchor?: 'start' | 'middle';
  className?: string;
  children: ReactNode;
}) {
  return (
    <text
      x={fixed(at.x)}
      y={fixed(at.y)}
      dx={`${fixed(offset.x)}em`}
      dy={`${fixed(offset.y)}em`}
      textAnchor={anchor}
      dominantBaseline="central"
      className={cn('fill-foreground uppercase tracking-[0.12em]', className)}
    >
      {children}
    </text>
  );
}

export function Readout({
  at,
  name,
  value,
  decimals = 2,
  className,
}: {
  at: Vec2;
  name: string;
  value: number;
  decimals?: number;
  className?: string;
}) {
  return (
    <text
      x={fixed(at.x)}
      y={fixed(at.y)}
      textAnchor="end"
      dominantBaseline="central"
      className={cn('fill-foreground', className)}
    >
      {`${name} = ${value.toFixed(decimals)}`}
    </text>
  );
}

export function Box({
  box,
  className,
  children,
}: {
  box: Rect;
  className?: string;
  children: ReactNode;
}) {
  return (
    <g className={className}>
      <Rectangle box={box} tone="page" fill={1} outline="ink" width={1.5} />
      <Title at={centre(box)}>{children}</Title>
    </g>
  );
}

type FrameAlign = 'start' | 'middle';

const frameTitle = ({ corner, size }: Rect, align: FrameAlign) => ({
  at: vec2(align === 'start' ? corner.x : corner.x + size.x / 2, corner.y),
  offset: vec2(0, -1),
});

export function Frame({
  box,
  title,
  align = 'start',
  className,
}: {
  box: Rect;
  title: string;
  align?: FrameAlign;
  className?: string;
}) {
  return (
    <g className={className}>
      <Rectangle
        box={box}
        tone="well"
        fill={1}
        outline="structure"
        dashed
        width={1}
        className="[stroke-linecap:butt]"
      />
      <Title {...frameTitle(box, align)} anchor={align}>
        {title}
      </Title>
    </g>
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
    <g style={paint('structure')} className={className}>
      <polyline
        points={points(leaderPath(target, label))}
        className="fill-none stroke-(--edge)"
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
  const edge = 'fill-none stroke-(--edge)';

  return (
    <g style={paint('structure')} className={className}>
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
