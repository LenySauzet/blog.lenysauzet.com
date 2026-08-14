'use client';

import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Slider as SliderRoot, sliderFill } from '@/components/ui/slider';

const SPRING = { stiffness: 320, damping: 30, mass: 0.6 };

// How far the bar gives when dragged past its end, and how quickly that give
// runs out. Both are small on purpose: the point is to answer the drag, not to
// let the bar be pulled around.
const GIVE_MAX = 12;
const GIVE_FALLOFF = 180;
// A squash slightly deeper than the stretch, which is what stops the give
// reading as the whole bar simply growing.
const SQUASH_RATIO = 1.5;

// Matches the grip's own inset inside the fill's leading edge.
const GRIP_INSET = 8;
const GRIP_CLEARANCE = 10;

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
  const reduceMotion = useReducedMotion();

  const frameRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  // Where the caption sits, so the grip knows when it is about to run into it.
  const metrics = useRef({ width: 0, labelEnd: 0, readoutStart: 0 });

  const percent = ((value - min) / (max - min)) * 100;
  const fill = useSpring(percent, SPRING);
  const width = useTransform(fill, (v) => `${v}%`);

  const give = useSpring(0, SPRING);
  const scaleX = useTransform(give, (px) =>
    metrics.current.width ? 1 + Math.abs(px) / metrics.current.width : 1
  );
  const scaleY = useTransform(scaleX, (s) => 1 - (s - 1) * SQUASH_RATIO);
  const transformOrigin = useTransform(give, (px) =>
    px < 0 ? 'right center' : 'left center'
  );

  // Set on the element rather than through a motion value: the fade itself is a
  // CSS transition, so all this has to carry is the target.
  const settleGrip = useCallback((v: number) => {
    const { width: w, labelEnd, readoutStart } = metrics.current;
    if (!w || !rangeRef.current) return;
    const x = (v / 100) * w - GRIP_INSET;
    const clear =
      x > labelEnd + GRIP_CLEARANCE && x < readoutStart - GRIP_CLEARANCE;
    rangeRef.current.style.setProperty('--grip-opacity', clear ? '1' : '0');
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
        labelEnd: labelBox ? labelBox.right - box.left : 0,
        readoutStart: readoutBox ? readoutBox.left - box.left : box.width,
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
          Math.sign(past) *
            ((GIVE_MAX * magnitude) / (magnitude + GIVE_FALLOFF))
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
            ref={rangeRef}
            data-slot="slider-range"
            className={sliderFill}
            style={{ width }}
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
