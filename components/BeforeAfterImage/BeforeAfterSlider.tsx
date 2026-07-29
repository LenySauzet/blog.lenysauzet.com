'use client';

import { ArrowLeft02Icon, ArrowRight02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import NextImage from 'next/image';
import { useRef, useState } from 'react';

import { cn } from '@/lib/utils';

const STEP = 5;
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

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  alt,
  defaultPosition,
  width,
  height,
}: BeforeAfterSliderProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(() => clamp(defaultPosition));
  const [dragging, setDragging] = useState(false);

  // Dragging writes the CSS var directly so it never waits on a React render;
  // `latest` holds the live value and keyboard steps build on it, so rapid
  // presses compound instead of reading a stale render.
  const latest = useRef(position);
  const frame = useRef(0);
  const apply = (next: number) => {
    const value = clamp(next);
    latest.current = value;
    wrapRef.current?.style.setProperty('--progress', `${value}%`);
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      setPosition(latest.current);
    });
  };

  const positionFromClientX = (clientX: number) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // Guarded: throws for a pointer that has already been released.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* no-op */
    }
    setDragging(true);
    apply(positionFromClientX(event.clientX));
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragging) apply(positionFromClientX(event.clientX));
  };
  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const base = latest.current;
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
      style={{ '--progress': `${position}%` } as React.CSSProperties}
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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ clipPath: 'inset(0 0 0 var(--progress))' }}
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
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 z-[1] -translate-x-1/2"
        style={{ left: 'var(--progress)' }}
      >
        <div
          className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2"
          style={{ backgroundColor: HANDLE_EDGE }}
        />
        <div
          className="absolute top-1/2 left-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-0.5 rounded-lg text-white shadow-md"
          style={{
            background: 'oklch(0.62 0.035 var(--base-hue) / 0.42)',
            border: `1px solid ${HANDLE_EDGE}`,
            backdropFilter: 'blur(var(--blur, 12px)) saturate(var(--saturate, 1.15))',
            WebkitBackdropFilter: 'blur(var(--blur, 12px)) saturate(var(--saturate, 1.15))',
          }}
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={14} strokeWidth={2.2} />
          <HugeiconsIcon icon={ArrowRight02Icon} size={14} strokeWidth={2.2} />
        </div>
      </div>
    </div>
  );
}
