'use client';

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import {
  Slider as SliderRoot,
  sliderDot,
  sliderFill,
  sliderGrip,
} from '@/components/ui/slider';
import { FOLLOW_SPRING } from '@/lib/springs';
import { cn } from '@/lib/utils';

const GIVE_SPRING = { stiffness: 300, damping: 14, mass: 0.6 };

const GIVE_MAX = 12;
const GIVE_FALLOFF = 180;
// Deeper than the stretch, or the give reads as the bar growing.
const SQUASH_RATIO = 1.5;

// Under 0.5, or the snap reads as a correction.
const STEP_RESISTANCE = 0.2;

const GRIP_INSET = 8;
const GRIP_MARGIN = 6;
const GRIP_CLEARANCE = 8;

const MAX_DOTS = 20;

const gripAt = (percent: number, width: number) =>
  Math.min(
    Math.max((percent / 100) * width - GRIP_INSET, GRIP_MARGIN),
    width - GRIP_MARGIN
  );

const collides = (x: number, [from, to]: number[]) =>
  x > from - GRIP_CLEARANCE && x < to + GRIP_CLEARANCE;

export interface SliderProps
  extends Omit<
    React.ComponentProps<typeof SliderRoot>,
    'value' | 'defaultValue' | 'onValueChange' | 'children'
  > {
  label: string;
  defaultValue?: number;
  unit?: string;
  decimals?: number;
  onValueChange?: (value: number) => void;
}

export default function Slider({
  label,
  defaultValue = 50,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  decimals = 0,
  disabled,
  className,
  onValueChange,
  ...props
}: SliderProps) {
  const [value, setValue] = useState(defaultValue);
  // Hidden until measured: the server cannot place the grip.
  const [gripClear, setGripClear] = useState(false);
  // Apart from `trackGive`, which skips reduced motion and would leave a drag idle.
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dots, setDots] = useState<number[]>([]);
  const reduceMotion = useReducedMotion();

  const frameRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const metrics = useRef({ width: 0, label: [0, 0], readout: [0, 0] });
  const clearRef = useRef(false);

  const percent = ((value - min) / (max - min)) * 100;
  const steps = Math.round((max - min) / step);
  const stepped = steps >= 2 && steps <= MAX_DOTS;
  const stepSpan = (step / (max - min)) * 100;
  const strainLimit = stepSpan * STEP_RESISTANCE;
  const percentRef = useRef(percent);
  const dragRef = useRef<{ rect: DOMRect; x: number } | null>(null);

  const fill = useSpring(percent, FOLLOW_SPRING);
  const width = useTransform(fill, (v) => `${v}%`);

  // A motion value, not a ref: a transform never sees a ref change.
  const trackWidth = useMotionValue(0);

  const gripX = useTransform([fill, trackWidth], ([v, w]: number[]) =>
    w ? gripAt(v, w) : GRIP_MARGIN
  );

  const givenSide = useRef(1);

  const give = useSpring(0, GIVE_SPRING);
  // Signed, never `Math.abs`: the spring settles by crossing zero.
  const scaleX = useTransform([give, trackWidth], ([px, w]: number[]) =>
    w ? 1 + (px * givenSide.current) / w : 1
  );
  const scaleY = useTransform(scaleX, (s) => 1 - (s - 1) * SQUASH_RATIO);
  const transformOrigin = useTransform(give, () =>
    givenSide.current < 0 ? 'right center' : 'left center'
  );

  const settleGrip = useCallback((v: number) => {
    const { width, label: labelBox, readout } = metrics.current;
    if (!width) return;
    const x = gripAt(v, width);
    const clear = !collides(x, labelBox) && !collides(x, readout);
    if (clear === clearRef.current) return;
    clearRef.current = clear;
    setGripClear(clear);
  }, []);

  const applyFill = useCallback(() => {
    const at = percentRef.current;
    const drag = dragRef.current;
    const strain =
      drag && strainLimit
        ? strainLimit *
          Math.tanh(
            (((drag.x - drag.rect.left) / drag.rect.width) * 100 - at) /
              strainLimit
          )
        : 0;
    const target = Math.min(Math.max(at + strain, 0), 100);
    if (reduceMotion) fill.jump(target);
    else fill.set(target);
  }, [fill, reduceMotion, strainLimit]);

  useEffect(() => {
    percentRef.current = percent;
    applyFill();
  }, [applyFill, percent]);

  useMotionValueEvent(fill, 'change', settleGrip);

  // Before paint, or the grip sits at the left edge for the first frames.
  useLayoutEffect(() => {
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
      trackWidth.set(box.width);
      settleGrip(fill.get());

      const { label: labelBounds, readout } = metrics.current;
      const next = stepped
        ? Array.from({ length: steps - 1 }, (_, i) => ((i + 1) / steps) * 100).filter(
            (pct) => {
              const x = (pct / 100) * box.width;
              return !collides(x, labelBounds) && !collides(x, readout);
            }
          )
        : [];
      setDots((prev) =>
        prev.length === next.length && prev.every((v, i) => v === next[i])
          ? prev
          : next
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [fill, settleGrip, stepped, steps, trackWidth]);

  const trackGive = useCallback(
    (event: React.PointerEvent) => {
      if (disabled || reduceMotion || !frameRef.current) return;
      const rect = frameRef.current.getBoundingClientRect();
      dragRef.current = { rect, x: event.clientX };

      const onMove = (moveEvent: PointerEvent) => {
        dragRef.current = { rect, x: moveEvent.clientX };
        const past =
          moveEvent.clientX > rect.right
            ? moveEvent.clientX - rect.right
            : moveEvent.clientX < rect.left
              ? moveEvent.clientX - rect.left
              : 0;
        const magnitude = Math.abs(past);
        if (past !== 0) givenSide.current = Math.sign(past);
        give.set(
          Math.sign(past) * ((GIVE_MAX * magnitude) / (magnitude + GIVE_FALLOFF))
        );

        applyFill();
      };
      const onRelease = () => {
        give.set(0);
        dragRef.current = null;
        applyFill();
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onRelease);
        window.removeEventListener('pointercancel', onRelease);
      };

      onMove(event.nativeEvent);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onRelease);
      window.addEventListener('pointercancel', onRelease);
    },
    [applyFill, disabled, give, reduceMotion]
  );

  const engaged = !disabled && (hovered || dragging);

  const beginDrag = useCallback(() => {
    setDragging(true);
    const end = () => {
      setDragging(false);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }, []);

  return (
    <div className={className}>
      <motion.div
        ref={frameRef}
        className={cn(
          'relative [transition:opacity_.2s_ease-in-out] motion-reduce:transition-none',
          !disabled && !engaged && 'opacity-85'
        )}
        style={{ scaleX, scaleY, transformOrigin }}
        onPointerDown={(event) => {
          beginDrag();
          trackGive(event);
        }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <SliderRoot
          value={[value]}
          onValueChange={([next]) => {
            setValue(next);
            onValueChange?.(next);
          }}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-label={label}
          {...props}
        >
          <motion.div
            data-slot="slider-range"
            className={sliderFill}
            style={{ width }}
          />
          {dots.map((pct) => (
            <span
              key={pct}
              aria-hidden
              data-slot="slider-dot"
              className={cn(
                sliderDot,
                Math.abs(pct - percent) < 0.01 ? 'opacity-0' : 'opacity-100'
              )}
              style={{ left: `${pct}%` }}
            />
          ))}
          <motion.div
            data-slot="slider-grip"
            className={cn(
              sliderGrip,
              !gripClear && 'opacity-0',
              gripClear && (engaged ? 'scale-y-100 opacity-100' : 'scale-y-75 opacity-40')
            )}
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
