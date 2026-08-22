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
import { cn } from '@/lib/utils';

// Damping ratio is damping / (2 * sqrt(stiffness * mass)); at or above 1 there
// is no overshoot at all and the motion is merely smooth. The give is free to be
// loose, since it only ever springs back to rest.
const GIVE_SPRING = { stiffness: 300, damping: 14, mass: 0.6 };

/**
 * One spring, running for the life of the component, that the fill chases the
 * whole time. Nothing here is triggered: a chase lags while its mark is moving
 * and catches up once it stops, which is the softness under a drag and the
 * settle at the end of one, from a single behaviour.
 *
 * Derived from the reference rather than guessed. Its fill trails a moving
 * pointer by 6.35 points at 125 points a second and converges to 0.001 the
 * moment the pointer holds still, and its clicks overshoot 1.2% of whatever
 * they cover. A lag of `2 * ratio * speed / frequency` and an overshoot of
 * `exp(-pi * ratio / sqrt(1 - ratio^2))` put that at a ratio of 0.81 and a
 * frequency of 32 rad/s, which is this.
 */
const FOLLOW_SPRING = { stiffness: 632, damping: 41, mass: 1 };

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

/**
 * Where the grip rides for a given fill, pinned inside the bar at both ends: at
 * the bottom of the range the fill has no width to hang it off, and it would
 * otherwise sit outside the track.
 */
const gripAt = (percent: number, width: number) =>
  Math.min(
    Math.max((percent / 100) * width - GRIP_INSET, GRIP_MARGIN),
    width - GRIP_MARGIN
  );

/** Whether a mark at `x` would run into a stretch of caption. */
const collides = (x: number, [from, to]: number[]) =>
  x > from - GRIP_CLEARANCE && x < to + GRIP_CLEARANCE;

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
  // Starts hidden: the grip's position is in measured pixels, so it has none until
  // the track is measured, and the server cannot measure. Its own opacity
  // transition then fades it in where it belongs.
  const [gripClear, setGripClear] = useState(false);
  // Held as state rather than derived at render: which detents are drawn
  // depends on how wide the caption measures, which is only known after layout.
  const [dots, setDots] = useState<number[]>([]);
  const reduceMotion = useReducedMotion();

  const frameRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  // Where the caption sits, so the grip knows what it is about to run into.
  const metrics = useRef({ width: 0, label: [0, 0], readout: [0, 0] });
  const clearRef = useRef(false);

  const percent = ((value - min) / (max - min)) * 100;
  // Coarse enough for its detents to be worth drawing.
  const steps = Math.round((max - min) / step);
  const stepped = steps >= 2 && steps <= MAX_DOTS;
  const stepSpan = (step / (max - min)) * 100;
  // How far the fill may be pulled off a step before the step gives way. Read
  // from the step itself, so a fine step resists imperceptibly and a coarse one
  // reads as a detent, with no separate prop to keep in sync.
  const strainLimit = stepSpan * STEP_RESISTANCE;
  const percentRef = useRef(percent);
  // The live drag, so the strain can be recomputed rather than remembered: it
  // is a function of where the pointer is *and* which step the value has landed
  // on, and the value changes on its own as Radix snaps.
  const dragRef = useRef<{ rect: DOMRect; x: number } | null>(null);

  const fill = useSpring(percent, FOLLOW_SPRING);
  const width = useTransform(fill, (v) => `${v}%`);

  // A motion value rather than a ref, because the width lands after mount: a
  // transform reading a ref would keep whatever it resolved to before the
  // measurement, and the grip would sit wherever it first fell.
  const trackWidth = useMotionValue(0);

  const gripX = useTransform([fill, trackWidth], ([v, w]: number[]) =>
    w ? gripAt(v, w) : GRIP_MARGIN
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
    const { width, label: labelBox, readout } = metrics.current;
    if (!width) return;
    const x = gripAt(v, width);
    const clear = !collides(x, labelBox) && !collides(x, readout);
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
    // Only ever moves the mark. Where the fill is in relation to it, and how it
    // gets there, is the spring's business — which is what keeps a drag, a
    // detent and a click on the far side of the bar all one motion.
    //
    // `jump` skips the spring entirely, which is the whole point of it under a
    // reduced-motion preference.
    if (reduceMotion) fill.jump(target);
    else fill.set(target);
  }, [fill, reduceMotion, strainLimit]);

  useEffect(() => {
    percentRef.current = percent;
    applyFill();
  }, [applyFill, percent]);

  useMotionValueEvent(fill, 'change', settleGrip);

  // Before paint, not after: the grip has no position until the track is measured,
  // and an effect would leave it parked at the left edge for the first frames.
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
