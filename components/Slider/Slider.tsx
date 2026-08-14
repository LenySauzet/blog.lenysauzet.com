'use client';

import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Slider as SliderRoot,
  sliderFill,
  sliderGrip,
} from '@/components/ui/slider';
import { cn } from '@/lib/utils';

// Damping ratio ~0.6, so the bar overshoots and settles rather than easing in.
// Anything at or above 1 is critically damped: smooth, and never elastic.
const ELASTIC = { stiffness: 340, damping: 18, mass: 0.65 };

// How far the bar gives when dragged past its end, and how quickly that give
// runs out. Both are small on purpose: the point is to answer the drag, not to
// let the bar be pulled around.
const GIVE_MAX = 12;
const GIVE_FALLOFF = 180;
// A squash slightly deeper than the stretch, which is what stops the give
// reading as the whole bar simply growing.
const SQUASH_RATIO = 1.5;

// Where the grip rides relative to the fill's leading edge, and how close it is
// allowed to get to either end and to the caption before it gets out of the way.
const GRIP_INSET = 8;
const GRIP_MARGIN = 6;
const GRIP_CLEARANCE = 8;

export interface SliderProps
  extends Omit<
    React.ComponentProps<typeof SliderRoot>,
    'value' | 'defaultValue' | 'onValueChange' | 'children'
  > {
  /** Named inside the bar, on the left. */
  label: string;
  defaultValue?: number;
  /** Appended to the readout, e.g. `%` or `px`. */
  unit?: string;
  decimals?: number;
}

/**
 * The label and readout sit over the bar rather than inside the control, so a
 * disabled slider fades its own surface without taking its caption with it.
 *
 * The readout is described by data, not by a formatter callback: a post is a
 * Server Component, and React cannot hand a function across that boundary.
 */
export default function Slider({
  label,
  defaultValue = 50,
  min = 0,
  max = 100,
  unit = '',
  decimals = 0,
  disabled,
  className,
  ...props
}: SliderProps) {
  const [value, setValue] = useState(defaultValue);
  const [gripClear, setGripClear] = useState(true);
  const reduceMotion = useReducedMotion();

  const frameRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  // Where the caption sits, so the grip knows what it is about to run into.
  const metrics = useRef({ width: 0, label: [0, 0], readout: [0, 0] });
  const clearRef = useRef(true);

  const percent = ((value - min) / (max - min)) * 100;
  const fill = useSpring(percent, ELASTIC);
  const width = useTransform(fill, (v) => `${v}%`);

  // Pinned inside the bar at both ends: at the bottom of the range the fill has
  // no width to hang the grip off, and it would otherwise sit outside the track.
  const gripX = useTransform(fill, (v) => {
    const w = metrics.current.width;
    if (!w) return GRIP_MARGIN;
    return Math.min(Math.max((v / 100) * w - GRIP_INSET, GRIP_MARGIN), w - GRIP_MARGIN);
  });

  const give = useSpring(0, ELASTIC);
  const scaleX = useTransform(give, (px) =>
    metrics.current.width ? 1 + Math.abs(px) / metrics.current.width : 1
  );
  const scaleY = useTransform(scaleX, (s) => 1 - (s - 1) * SQUASH_RATIO);
  const transformOrigin = useTransform(give, (px) =>
    px < 0 ? 'right center' : 'left center'
  );

  // The grip hides only where it would collide with the caption, so it stays
  // visible past either end of it: before the label at the bottom of the range,
  // past the readout at the top.
  const settleGrip = useCallback((v: number) => {
    const { width: w, label: labelBox, readout } = metrics.current;
    if (!w) return;
    const x = Math.min(
      Math.max((v / 100) * w - GRIP_INSET, GRIP_MARGIN),
      w - GRIP_MARGIN
    );
    const hits = ([from, to]: number[]) =>
      x > from - GRIP_CLEARANCE && x < to + GRIP_CLEARANCE;
    const clear = !hits(labelBox) && !hits(readout);
    if (clear === clearRef.current) return;
    clearRef.current = clear;
    setGripClear(clear);
  }, []);

  useEffect(() => {
    // `jump` lands without running the spring, which is the whole point of it
    // under a reduced-motion preference.
    if (reduceMotion) fill.jump(percent);
    else fill.set(percent);
  }, [fill, percent, reduceMotion]);

  useMotionValueEvent(fill, 'change', settleGrip);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => {
      const box = frame.getBoundingClientRect();
      const labelBox = labelRef.current?.getBoundingClientRect();
      const readoutBox = readoutRef.current?.getBoundingClientRect();
      metrics.current = {
        width: box.width,
        label: labelBox ? [labelBox.left - box.left, labelBox.right - box.left] : [0, 0],
        readout: readoutBox
          ? [readoutBox.left - box.left, readoutBox.right - box.left]
          : [box.width, box.width],
      };
      settleGrip(fill.get());
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [fill, settleGrip]);

  // Radix clamps the value at the ends, so the overshoot has to be read from
  // the pointer itself. The rect is captured once: the frame is being scaled by
  // what we are about to set, and re-reading it would feed back into itself.
  const trackGive = useCallback(
    (event: React.PointerEvent) => {
      if (disabled || reduceMotion || !frameRef.current) return;
      const rect = frameRef.current.getBoundingClientRect();

      const onMove = (moveEvent: PointerEvent) => {
        const past =
          moveEvent.clientX > rect.right
            ? moveEvent.clientX - rect.right
            : moveEvent.clientX < rect.left
              ? moveEvent.clientX - rect.left
              : 0;
        const magnitude = Math.abs(past);
        give.set(
          Math.sign(past) * ((GIVE_MAX * magnitude) / (magnitude + GIVE_FALLOFF))
        );
      };
      const onRelease = () => {
        give.set(0);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onRelease);
        window.removeEventListener('pointercancel', onRelease);
      };

      onMove(event.nativeEvent);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onRelease);
      window.addEventListener('pointercancel', onRelease);
    },
    [disabled, give, reduceMotion]
  );

  return (
    <div className={className}>
      <motion.div
        ref={frameRef}
        className="relative"
        style={{ scaleX, scaleY, transformOrigin }}
        onPointerDown={trackGive}
      >
        <SliderRoot
          value={[value]}
          onValueChange={([next]) => setValue(next)}
          min={min}
          max={max}
          disabled={disabled}
          aria-label={label}
          {...props}
        >
          <motion.div
            data-slot="slider-range"
            className={sliderFill}
            style={{ width }}
          />
          <motion.div
            data-slot="slider-grip"
            className={cn(sliderGrip, gripClear ? 'opacity-100' : 'opacity-0')}
            style={{ x: gripX }}
          />
        </SliderRoot>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-4 font-display text-sm font-semibold">
          <span ref={labelRef} className="text-muted-foreground">
            {label}
          </span>
          <span ref={readoutRef} className="text-foreground tabular-nums">
            {value.toFixed(decimals)}
            {unit}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
