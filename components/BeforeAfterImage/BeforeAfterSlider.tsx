'use client';

import { ArrowLeft02Icon, ArrowRight02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  motion,
  type MotionValue,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import NextImage from 'next/image';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

import { glassSurface } from '@/components/ui/glass';
import { FOLLOW_SPRING } from '@/lib/springs';
import { cn } from '@/lib/utils';

import { afterRegion, dividerPath, labelOpacity, type LabelSpan, pullFor } from './divider';

const STEP = 5;
const HELD_SCALE = 1.1;
// A pickup, its own spring: loose enough to pop, and untouched by tuning the chase.
const HELD_SPRING = { type: 'spring', stiffness: 500, damping: 22, mass: 0.6 } as const;
const SIZES = '(max-width: 768px) calc(100vw - 2rem), 700px';
// Sits on the image, not on a theme surface, so it is a fixed tint that reads in
// both themes rather than a semantic token.
const HANDLE_EDGE = 'oklch(0.82 0.03 var(--base-hue) / 0.45)';
const clamp = (value: number) => Math.min(Math.max(value, 0), 100);

export interface BeforeAfterSliderProps {
  /** Fully resolved URLs; resolution happens on the server. */
  beforeSrc: string;
  afterSrc: string;
  /** Accessible name for the slider. */
  alt: string;
  defaultPosition: number;
  width: number;
  height: number;
}

function Label({
  side,
  progress,
  width,
}: {
  side: 'before' | 'after';
  progress: MotionValue<number>;
  width: MotionValue<number>;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const span = useMotionValue<LabelSpan | null>(null);

  useLayoutEffect(() => {
    const label = ref.current!;
    const measure = () => {
      const box = label.getBoundingClientRect();
      const surface = label.parentElement!;
      const left = surface.getBoundingClientRect().left + surface.clientLeft;
      span.set({ center: box.left - left + box.width / 2, half: box.width / 2 });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(label);
    observer.observe(label.parentElement!);
    return () => observer.disconnect();
  }, [span]);

  // Every input is read before branching: a transform subscribes only to the values
  // its last run read, so one skipped while unmeasured would never be tracked.
  const opacity = useTransform(() => {
    const x = (progress.get() / 100) * width.get();
    const measured = span.get();
    return measured ? labelOpacity(side, x, measured) : 1;
  });

  return (
    <motion.span
      ref={ref}
      aria-hidden="true"
      style={{ opacity }}
      className={cn(
        glassSurface,
        'pointer-events-none absolute top-3 z-[1] rounded-full px-2.5 py-0.5 font-display text-xs font-medium text-foreground',
        side === 'before' ? 'left-3' : 'right-3'
      )}
    >
      {side === 'before' ? 'Before' : 'After'}
    </motion.span>
  );
}

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  alt,
  defaultPosition,
  width,
  height,
}: BeforeAfterSliderProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const clipId = useId();
  const reduce = useReducedMotion();
  const [position, setPosition] = useState(() => clamp(defaultPosition));
  const [measured, setMeasured] = useState(false);
  const [held, setHeld] = useState(false);

  // Input moves the target and the drawing chases it on a spring, so a click or a
  // key glides there; neither waits on a React render, and `aria-valuenow` follows
  // the target once a frame.
  const target = useMotionValue(position);
  const follow = useSpring(target, FOLLOW_SPRING);
  // The overshoot past an end is held at the edge, or the line would leave the image.
  const progress = useTransform(follow, clamp);
  const surfaceWidth = useMotionValue(0);
  const surfaceHeight = useMotionValue(0);
  const pullTarget = useMotionValue(0);
  const pull = useSpring(pullTarget, { stiffness: 380, damping: 20, mass: 0.45 });

  const divider = useTransform(() =>
    dividerPath((progress.get() / 100) * surfaceWidth.get(), pull.get(), surfaceWidth.get(), surfaceHeight.get())
  );
  const region = useTransform(() => afterRegion(divider.get(), surfaceWidth.get(), surfaceHeight.get()));
  const viewBox = useTransform(() => `0 0 ${surfaceWidth.get() || 1} ${surfaceHeight.get() || 1}`);
  const handleLeft = useTransform(progress, (value) => `${value}%`);
  const insetClip = useTransform(progress, (value) => `inset(0 0 0 ${value}%)`);

  const frame = useRef(0);
  const apply = (next: number) => {
    target.set(clamp(next));
    if (reduce) follow.jump(target.get());
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      setPosition(target.get());
    });
  };

  const drag = useRef<{ pointerId: number; originX: number; x: number; time: number } | null>(null);
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);
  const release = () => {
    clearTimeout(settle.current);
    pullTarget.set(0);
  };

  const xFrom = (clientX: number) => {
    const wrap = wrapRef.current!;
    const width = wrap.clientWidth;
    const x = Math.min(width, Math.max(0, clientX - wrap.getBoundingClientRect().left - wrap.clientLeft));
    apply((x / width) * 100);
    return x;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    release();
    // Throws for a pointer already released, which has nothing left to drag.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      return;
    }
    setHeld(true);
    const x = xFrom(event.clientX);
    drag.current = { pointerId: event.pointerId, originX: x, x, time: event.timeStamp };
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const x = xFrom(event.clientX);
    const velocity = (x - current.x) / Math.max(8, event.timeStamp - current.time);
    drag.current = { ...current, x, time: event.timeStamp };
    if (reduce) return;
    pullTarget.set(pullFor(velocity, x - current.originX));
    // A pointer that stops sends no more moves, so the line settles on its own.
    clearTimeout(settle.current);
    settle.current = setTimeout(() => pullTarget.set(0), 80);
  };
  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    setHeld(false);
    release();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const base = target.get();
    const moves: Record<string, number> = {
      ArrowLeft: base - STEP,
      ArrowRight: base + STEP,
      PageDown: base - STEP * 2,
      PageUp: base + STEP * 2,
      Home: 0,
      End: 100,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    apply(moves[event.key]);
  };

  // Inside the border, the box the clipped image and the divider are laid out in:
  // measured with it, the line and the clip part by the border's width.
  useLayoutEffect(() => {
    const wrap = wrapRef.current!;
    const measure = () => {
      surfaceWidth.set(wrap.clientWidth);
      surfaceHeight.set(wrap.clientHeight);
      setMeasured(wrap.clientWidth > 0);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    return () => {
      observer.disconnect();
      clearTimeout(settle.current);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [surfaceWidth, surfaceHeight]);

  useEffect(() => {
    if (reduce) pull.jump(0);
  }, [reduce, pull]);

  const imageClass = 'pointer-events-none block h-auto w-full select-none';

  return (
    <div
      ref={wrapRef}
      role="slider"
      tabIndex={0}
      aria-label={alt}
      aria-orientation="horizontal"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      className={cn(
        'relative flex w-full touch-none cursor-ew-resize overflow-hidden rounded-xl border-2 border-border select-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none'
      )}
    >
      <NextImage
        src={beforeSrc}
        alt=""
        width={width}
        height={height}
        sizes={SIZES}
        loading="eager"
        draggable={false}
        className={imageClass}
      />
      {/* Clipped by the bowed divider once the surface is measured; a plain inset
          until then, so the first paint already splits the two. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ clipPath: measured ? `url("#${clipId}")` : insetClip }}
      >
        <NextImage
          src={afterSrc}
          alt=""
          width={width}
          height={height}
          sizes={SIZES}
          loading="eager"
          draggable={false}
          className={imageClass}
        />
      </motion.div>
      <Label side="before" progress={progress} width={surfaceWidth} />
      <Label side="after" progress={progress} width={surfaceWidth} />
      <motion.svg
        aria-hidden="true"
        viewBox={viewBox}
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 z-[1] size-full"
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <motion.path d={region} />
          </clipPath>
        </defs>
        {measured && <motion.path d={divider} fill="none" strokeWidth={1} style={{ stroke: HANDLE_EDGE }} />}
      </motion.svg>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 z-[1] flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-0.5 rounded-lg text-white shadow-md backdrop-blur-md backdrop-saturate-[115%]"
        animate={{ scale: held && !reduce ? HELD_SCALE : 1 }}
        transition={HELD_SPRING}
        style={{
          left: handleLeft,
          background: 'oklch(0.62 0.035 var(--base-hue) / 0.42)',
          border: `1px solid ${HANDLE_EDGE}`,
        }}
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} size={14} strokeWidth={2.2} />
        <HugeiconsIcon icon={ArrowRight02Icon} size={14} strokeWidth={2.2} />
      </motion.div>
    </div>
  );
}
