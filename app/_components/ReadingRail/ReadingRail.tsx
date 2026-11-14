'use client';

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { blurRamp, EASED } from '@/components/ScrollFade';
import { scrollProgress } from '@/hooks/use-scroll-tracking';
import { handOnWheel, scrollColumn, travelOf } from '@/lib/scroll-column';
import { cn } from '@/lib/utils';

import { layOutTicks, tickAt } from './rail';
import { Tick } from './Tick';
import { passDuration, useCascade, walkDuration } from './use-cascade';
import { LANDING, useSections } from './use-sections';

const SPACING = 14;

const VEIL_BLUR = 14;

const VEIL_MARGIN = 120;

const VEIL_SOLID = 0.28;

const RAMP = blurRamp('to left', VEIL_SOLID * 100, EASED);

const FADE = { duration: 0.3, ease: [0.22, 0.61, 0.36, 1] } as const;
const VEIL = { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] } as const;
const AT_ONCE = { duration: 0 } as const;

export function ReadingRail() {
  const sections = useSections();
  const field = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [opened, setOpened] = useState(false);
  const [pointed, setPointed] = useState<number>();
  const [reached, setReached] = useState(0);
  const [widest, setWidest] = useState(0);
  const still = useReducedMotion();

  const unfolded = opened && sections.length > 0;

  useEffect(() => {
    const node = field.current;
    if (!node) return;

    const resized = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height));
    resized.observe(node);

    return () => resized.disconnect();
  }, []);

  const count = Math.floor(height / SPACING);
  const ticks = useMemo(() => layOutTicks(count, sections), [count, sections]);

  const cascade = useCascade(sections, unfolded, Boolean(still));
  const veil = useMotionValue(0);

  useEffect(() => {
    const running = animate(
      veil,
      unfolded ? 1 : 0,
      still
        ? AT_ONCE
        : { ...VEIL, delay: unfolded ? 0 : walkDuration(sections.length) }
    );

    return () => running.stop();
  }, [unfolded, still, veil, sections.length]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const node = field.current;
      if (!node) return;

      const right = node.getBoundingClientRect().right;
      const reaches = [...node.querySelectorAll('[data-title]')].map(
        (title) => right - title.getBoundingClientRect().left
      );

      setWidest(reaches.length ? Math.round(Math.max(...reaches)) : 0);
    });

    return () => cancelAnimationFrame(frame);
  }, [sections, height]);

  // `none` at rest: a mounted backdrop filter re-blurs every frame, even at 0px.
  const backdrop = useTransform(veil, (shown) =>
    shown === 0 ? 'none' : `blur(${(shown * VEIL_BLUR).toFixed(2)}px)`
  );

  const anchored = useTransform(scrollProgress, (progress) =>
    count < 2 ? 0 : tickAt(count, progress) / (count - 1)
  );
  const top = useTransform(anchored, (progress) => `${progress * 100}%`);
  const readout = useTransform(anchored, (progress) => progress.toFixed(2));

  useMotionValueEvent(anchored, 'change', (progress) =>
    setReached(count < 2 ? 0 : Math.round(progress * (count - 1)))
  );

  // Off the event, not state: a click batched with its move would hit the tick before.
  const under = (event: { clientY: number }) => {
    const box = field.current?.getBoundingClientRect();

    return box ? tickAt(count, (event.clientY - box.top) / box.height) : undefined;
  };

  const go = (event: React.MouseEvent) => {
    const index = under(event);
    const tick = index === undefined ? undefined : ticks[index];
    const column = scrollColumn();
    if (!tick || !column) return;

    column.scrollTo({
      top: tick.section
        ? Math.max(0, tick.section.top - LANDING)
        : tick.progress * travelOf(column),
      behavior: still ? 'auto' : 'smooth',
    });
  };

  const depart = (event: React.PointerEvent) => {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;

    setOpened(false);
    setPointed(undefined);
  };

  return (
    <div
      aria-hidden
      onPointerOver={() => setOpened(true)}
      onPointerOut={depart}
      onPointerMove={(event) => {
        const index = under(event);
        setPointed((was) => (was === index ? was : index));
      }}
      onWheel={handOnWheel}
      onClick={go}
      style={{ width: widest ? widest + VEIL_MARGIN : undefined }}
      className="pointer-events-none fixed top-0 right-0 z-[45] hidden h-dvh cursor-pointer py-24 pointer-fine:md:block"
    >
      <div className="pointer-events-auto absolute inset-y-0 right-0 w-12 lg:w-28" />

      <div
        style={{ width: widest || undefined }}
        className={cn(
          'absolute inset-y-0 right-0',
          unfolded ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      />

      <div className="pointer-events-none absolute inset-0 xl:hidden">
        <motion.div
          className="absolute inset-0"
          style={{
            backdropFilter: backdrop,
            WebkitBackdropFilter: backdrop,
            maskImage: RAMP,
            WebkitMaskImage: RAMP,
          }}
        />
        <motion.div
          className="absolute inset-0 bg-background"
          style={{ opacity: veil, maskImage: RAMP, WebkitMaskImage: RAMP }}
        />
      </div>

      <div ref={field} className="pointer-events-none relative h-full">
        {ticks.map((tick, index) => (
          <Tick
            key={index}
            progress={tick.progress}
            section={tick.section}
            pointed={pointed === index}
            reached={reached === index}
            shown={tick.section && cascade.get(tick.section)}
          />
        ))}

        <motion.span
          style={{ top }}
          animate={{ opacity: unfolded ? 0 : 1 }}
          transition={
            still
              ? AT_ONCE
              : { ...FADE, delay: unfolded ? 0 : passDuration(sections.length) }
          }
          className="absolute right-0 -translate-y-1/2 pr-10 font-mono text-[0.6875rem] tracking-wider text-primary tabular-nums"
        >
          {readout}
        </motion.span>
      </div>
    </div>
  );
}
