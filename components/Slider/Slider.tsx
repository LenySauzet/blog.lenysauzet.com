'use client';

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Slider as SliderRoot,
  sliderDot,
  sliderFill,
  sliderGrip,
} from '@/components/ui/slider';
import { cn } from '@/lib/utils';

// Damping ratio is damping / (2 * sqrt(stiffness * mass)); at or above 1 there
// is no overshoot at all and the motion is merely smooth. Travel sits near 0.84,
// enough to be felt without the bar visibly bouncing past the pointer. The give
// is free to be looser, since it only ever springs back to rest.
const TRAVEL_SPRING = { stiffness: 340, damping: 25, mass: 0.65 };
const GIVE_SPRING = { stiffness: 300, damping: 14, mass: 0.6 };

// A detent is a different motion from a travel. Overshoot scales with the
// distance covered, so the setting that keeps a click across the whole bar calm
// leaves a snap between two steps limp. Stiffer and looser: ~0.54, landing in
// roughly a tenth of a second.
const SNAP_SPRING = { stiffness: 700, damping: 20, mass: 0.5 };

// How far the bar gives when dragged past its end, and how quickly that give
// runs out. Both are small on purpose: the point is to answer the drag, not to
// let the bar be pulled around.
const GIVE_MAX = 12;
const GIVE_FALLOFF = 180;
// A squash slightly deeper than the stretch, which is what stops the give
// reading as the whole bar simply growing.
const SQUASH_RATIO = 1.5;

// The fraction of a step the fill can be dragged off its detent. Below a half
// it can never overtake the step it is leaving, so the snap always reads as a
// release rather than a correction.
const STEP_RESISTANCE = 0.2;

// Where the grip rides relative to the fill's leading edge, and how close it is
// allowed to get to either end and to the caption before it gets out of the way.
const GRIP_INSET = 8;
const GRIP_MARGIN = 6;
const GRIP_CLEARANCE = 8;

// Past this many steps the detents stop being countable and read as texture, so
// the bar shows none: a continuous slider is stepped by 1 and would draw one
// dot per unit.
const MAX_DOTS = 20;

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
  step = 1,
  unit = '',
  decimals = 0,
  disabled,
  className,
  ...props
}: SliderProps) {
  const [value, setValue] = useState(defaultValue);
  const [gripClear, setGripClear] = useState(true);
  // Held as state rather than derived at render: which detents are drawn
  // depends on how wide the caption measures, which is only known after layout.
  const [dots, setDots] = useState<number[]>([]);
  const reduceMotion = useReducedMotion();

  const frameRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  // Where the caption sits, so the grip knows what it is about to run into.
  const metrics = useRef({ width: 0, label: [0, 0], readout: [0, 0] });
  const clearRef = useRef(true);

  const percent = ((value - min) / (max - min)) * 100;
  // One definition of "stepped" for everything that keys off it: the dots, and
  // the spring that lands on them.
  const steps = Math.round((max - min) / step);
  const stepped = steps >= 2 && steps <= MAX_DOTS;
  // How far the fill may be pulled off a step before the step gives way. Read
  // from the step itself, so a fine step resists imperceptibly and a coarse one
  // reads as a detent, with no separate prop to keep in sync.
  const strainLimit = ((step / (max - min)) * 100) * STEP_RESISTANCE;
  const percentRef = useRef(percent);
  // The live drag, so the strain can be recomputed rather than remembered: it
  // is a function of where the pointer is *and* which step the value has landed
  // on, and the value changes on its own as Radix snaps.
  const dragRef = useRef<{ rect: DOMRect; x: number } | null>(null);

  const fill = useSpring(percent, stepped ? SNAP_SPRING : TRAVEL_SPRING);
  const width = useTransform(fill, (v) => `${v}%`);

  // A motion value rather than a ref, because the width lands after mount: a
  // transform reading a ref would keep whatever it resolved to before the
  // measurement, and the grip would sit wherever it first fell.
  const trackWidth = useMotionValue(0);

  // Pinned inside the bar at both ends: at the bottom of the range the fill has
  // no width to hang the grip off, and it would otherwise sit outside the track.
  const gripX = useTransform([fill, trackWidth], ([v, w]: number[]) =>
    w
      ? Math.min(Math.max((v / 100) * w - GRIP_INSET, GRIP_MARGIN), w - GRIP_MARGIN)
      : GRIP_MARGIN
  );

  // Latched at the side the drag ran out of, not read live: the give springs
  // back through zero, and a live sign would flip the anchor mid-bounce.
  const givenSide = useRef(1);

  const give = useSpring(0, GIVE_SPRING);
  // Signed against the side that was pulled, never `Math.abs`. The spring
  // settles by crossing zero, and an absolute value turns that rebound back
  // into a second stretch: the bar bumps outward twice instead of recoiling.
  const scaleX = useTransform([give, trackWidth], ([px, w]: number[]) =>
    w ? 1 + (px * givenSide.current) / w : 1
  );
  const scaleY = useTransform(scaleX, (s) => 1 - (s - 1) * SQUASH_RATIO);
  const transformOrigin = useTransform(give, () =>
    givenSide.current < 0 ? 'right center' : 'left center'
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

  // The fill answers to the step it sits on plus whatever the drag is currently
  // straining against it, so both have to go through one place: setting the
  // value alone would drop the strain on the frame the step changes.
  const applyFill = useCallback(() => {
    const at = percentRef.current;
    const drag = dragRef.current;
    // tanh, because it leaves the detent at slope 1 and only firms up near the
    // limit: the bar tracks the pointer exactly for the first pixels, which is
    // what makes the resistance feel like resistance rather than like lag. A
    // ratio damps from the very first pixel and never tracks.
    const strain =
      drag && strainLimit
        ? strainLimit *
          Math.tanh(
            (((drag.x - drag.rect.left) / drag.rect.width) * 100 - at) /
              strainLimit
          )
        : 0;
    const target = Math.min(Math.max(at + strain, 0), 100);
    // `jump` lands without running the spring, which is the whole point of it
    // under a reduced-motion preference.
    if (reduceMotion) fill.jump(target);
    else fill.set(target);
  }, [fill, reduceMotion, strainLimit]);

  useEffect(() => {
    percentRef.current = percent;
    applyFill();
  }, [applyFill, percent]);

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
      trackWidth.set(box.width);
      settleGrip(fill.get());

      const { label: labelBounds, readout } = metrics.current;
      const hits = (x: number, [from, to]: number[]) =>
        x > from - GRIP_CLEARANCE && x < to + GRIP_CLEARANCE;
      const next = stepped
        ? Array.from({ length: steps - 1 }, (_, i) => ((i + 1) / steps) * 100).filter(
            (pct) => {
              const x = (pct / 100) * box.width;
              return !hits(x, labelBounds) && !hits(x, readout);
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

  // Radix clamps the value at the ends, so the overshoot has to be read from
  // the pointer itself. The rect is captured once: the frame is being scaled by
  // what we are about to set, and re-reading it would feed back into itself.
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
              // Compared with a tolerance rather than for equality: both sides
              // are a division reduced to a percentage, and thirds do not land
              // on the same last digit.
              className={cn(
                sliderDot,
                Math.abs(pct - percent) < 0.01 ? 'opacity-0' : 'opacity-100'
              )}
              style={{ left: `${pct}%` }}
            />
          ))}
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
