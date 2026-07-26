'use client';

import { ArrowLeft02Icon, ArrowRight02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import NextImage from 'next/image';
import { useRef, useState } from 'react';

import { cn } from '@/lib/utils';

const STEP = 5;
const SIZES = '(max-width: 768px) calc(100vw - 2rem), 700px';
// The handle's edge colour — a light base-hue tint that reads on any image in
// either theme. The divider reuses it so the two lines always match, with the
// handle border as the single source of truth.
const HANDLE_EDGE = 'oklch(0.82 0.03 var(--base-hue) / 0.45)';
const clamp = (value: number) => Math.min(Math.max(value, 0), 100);

export interface BeforeAfterSliderProps {
  /** Fully resolved URLs — resolution happens on the server. */
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

  // The divider is driven straight to the CSS var so dragging never waits on a
  // React render; `latest` holds the live value and aria-valuenow is synced once
  // per frame. `latest` (not `position`) is the base for keyboard steps, so rapid
  // presses compound correctly instead of reading a stale render.
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
    // Capture so the drag keeps tracking outside the element; guarded because it
    // throws for a pointer that's already been released.
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
        // Same 2px --border as the site's images; the divider/handle sit on the
        // image itself and keep HANDLE_EDGE (a theme token would half-vanish there).
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
      {/* The "after" image, clipped from the left to the divider. */}
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
      {/* Divider line + glass handle, centred on the divider. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 z-[1] -translate-x-1/2"
        style={{ left: 'var(--progress)' }}
      >
        <div
          className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2"
          style={{ backgroundColor: HANDLE_EDGE }}
        />
        {/* A control that sits on the (theme-independent) image, so its glass is a
            fixed base-hue grey-blue — identical and legible in both themes rather
            than following the page's surface tokens, which broke it in light. */}
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
