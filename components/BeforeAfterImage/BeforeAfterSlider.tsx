'use client';

import { ChevronsLeftRightIcon } from '@hugeicons/core-free-icons';
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
import { useId, useLayoutEffect, useRef, useState } from 'react';

import { mediaGlass } from '@/components/ui/glass';
import { FOLLOW_SPRING } from '@/lib/springs';
import { cn } from '@/lib/utils';

import { afterRegion, dividerPath, labelOpacity, type LabelSpan, pullFor } from './divider';

const STEP = 5;
const HELD_SCALE = 1.1;
// A pickup, its own spring: loose enough to pop, and untouched by tuning the chase.
const HELD_SPRING = { type: 'spring', stiffness: 500, damping: 22, mass: 0.6 } as const;
const SIZES = '(max-width: 768px) calc(100vw - 2rem), 700px';
// The divider sits on the image, not on a theme surface, so it is a fixed tint that
// reads in both themes rather than a semantic token.
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
  className?: string;
}

interface LabelProps {
  side: 'before' | 'after';
  progress: MotionValue<number>;
  width: MotionValue<number>;
}

function Label({ side, progress, width }: LabelProps) {
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

  // Every input is read before branching: a transform subscribes only to what it read
  // when the component last rendered, so one skipped while unmeasured goes untracked.
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
        mediaGlass,
        'pointer-events-none absolute top-3 z-[1] rounded-full px-2.5 py-0.5 font-display text-xs font-medium',
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
  className,
}: BeforeAfterSliderProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const clipId = useId();
  const reduce = useReducedMotion();
  const [measured, setMeasured] = useState(false);
  const [held, setHeld] = useState(false);

  // Input moves the target and the drawing chases it on a spring, so a click or a
  // key glides there. Nothing re-renders: `aria-valuenow` is written to the element
  // once a frame, and React, whose prop never changes, leaves it alone.
  const target = useMotionValue(clamp(defaultPosition));
  const follow = useSpring(target, FOLLOW_SPRING);
  // The overshoot past an end is held at the edge, or the line would leave the image.
  const progress = useTransform(follow, clamp);
  const surfaceWidth = useMotionValue(0);
  const surfaceHeight = useMotionValue(0);
  // Re-run on each spring frame for the spring's own speed, which `jump` zeroes.
  // `useVelocity` would read a reduced-motion jump as speed, and drops to 0
  // between frames mid-drag, flickering the bow.
  const pull = useTransform(follow, () => pullFor(follow.getVelocity(), surfaceWidth.get()));

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
      wrapRef.current?.setAttribute('aria-valuenow', String(Math.round(target.get())));
    });
  };

  const pointer = useRef<number | null>(null);

  const moveTo = (clientX: number) => {
    const wrap = wrapRef.current!;
    apply(((clientX - wrap.getBoundingClientRect().left - wrap.clientLeft) / wrap.clientWidth) * 100);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    // Throws for a pointer already released, which has nothing left to drag.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      return;
    }
    setHeld(true);
    pointer.current = event.pointerId;
    moveTo(event.clientX);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointer.current === event.pointerId) moveTo(event.clientX);
  };
  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== event.pointerId) return;
    pointer.current = null;
    setHeld(false);
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
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [surfaceWidth, surfaceHeight]);

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
      aria-valuenow={Math.round(clamp(defaultPosition))}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      className={cn(
        'relative flex w-full touch-none cursor-ew-resize overflow-hidden rounded-frame-xl border-2 border-border select-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
        className
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
      {/* The server's line, straight, until the surface is measured and the path draws. */}
      {!measured && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 z-[1] w-px -translate-x-1/2"
          style={{ left: handleLeft, backgroundColor: HANDLE_EDGE }}
        />
      )}
      <motion.div
        aria-hidden="true"
        className={cn(
          mediaGlass,
          'pointer-events-none absolute top-1/2 z-[1] flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg'
        )}
        animate={{ scale: held && !reduce ? HELD_SCALE : 1 }}
        transition={HELD_SPRING}
        style={{ left: handleLeft }}
      >
        <HugeiconsIcon icon={ChevronsLeftRightIcon} size={16} strokeWidth={2} />
      </motion.div>
    </div>
  );
}
