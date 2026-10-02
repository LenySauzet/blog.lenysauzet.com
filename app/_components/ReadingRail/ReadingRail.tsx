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

import { scrollProgress } from '@/hooks/use-scroll-tracking';
import { handOnWheel, scrollColumn, travelOf } from '@/lib/scroll-column';
import { cn } from '@/lib/utils';

import { layOutTicks, tickAt } from './rail';
import { Tick } from './Tick';
import { LANDING, useSections } from './use-sections';

const SPACING = 14;

const REVEAL = { duration: 0.75, ease: [0.22, 0.61, 0.36, 1] } as const;
const FADE = { duration: 0.3, ease: [0.22, 0.61, 0.36, 1] } as const;
const AT_ONCE = { duration: 0 } as const;

/** How much of the unfolding is spent cascading rather than fading, which is
    what spreads the titles down the rail instead of showing them at once. */
const SPREAD = 0.6;

export function ReadingRail() {
  const sections = useSections();
  const field = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [opened, setOpened] = useState(false);
  const [pointed, setPointed] = useState<number>();
  const [reached, setReached] = useState(0);
  const still = useReducedMotion();

  useEffect(() => {
    const node = field.current;
    if (!node) return;

    const resized = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height));
    resized.observe(node);

    return () => resized.disconnect();
  }, []);

  const count = Math.floor(height / SPACING);
  const ticks = useMemo(() => layOutTicks(count, sections), [count, sections]);
  const order = useMemo(
    () => new Map(sections.map((section, index) => [section, index])),
    [sections]
  );

  /**
   * Two boundaries, each only ever sweeping down the rail, and a title is shown
   * by the first and taken by the second. One value could only rewind to close,
   * which runs the cascade back up; two let both passes read top to bottom.
   *
   * Neither carries a delay, which is what used to strand a title: a delay has
   * to run out before its title moves at all, so a pointer in and out faster
   * than the cascade left whatever was still waiting sitting at half a blur.
   */
  const reveal = useMotionValue(0);
  const hide = useMotionValue(0);

  useEffect(() => {
    const transition = still ? AT_ONCE : REVEAL;

    if (opened) {
      // Interrupting a close rewinds it, which is the honest undoing of a pass
      // that had already taken half the titles.
      const sweeps = [animate(reveal, 1, transition), animate(hide, 0, transition)];
      return () => sweeps.forEach((sweep) => sweep.stop());
    }

    const sweep = animate(hide, 1, {
      ...transition,
      // Both are back at rest here, and every title is already at nothing, so
      // the next open starts from the top again without anything showing it.
      onComplete: () => {
        reveal.set(0);
        hide.set(0);
      },
    });

    return () => sweep.stop();
  }, [opened, still, reveal, hide]);

  const share = useMemo(() => {
    const step = sections.length < 2 ? 0 : SPREAD / (sections.length - 1);

    return sections.map((_, index) => ({
      from: index * step,
      to: index * step + (1 - SPREAD),
    }));
  }, [sections]);

  // The ticks are the anchors, so the mark rests on one rather than sliding
  // between them: the reader scrolls a little and it steps.
  const anchored = useTransform(scrollProgress, (progress) =>
    count < 2 ? 0 : tickAt(count, progress) / (count - 1)
  );
  const top = useTransform(anchored, (progress) => `${progress * 100}%`);
  const readout = useTransform(anchored, (progress) => progress.toFixed(2));

  useMotionValueEvent(anchored, 'change', (progress) =>
    setReached(count < 2 ? 0 : Math.round(progress * (count - 1)))
  );

  /** Read off the event rather than the state the pointer last set: a click
      arriving in the same batch as its move would otherwise act on the tick
      before it. */
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

  return (
    <div
      aria-hidden
      onPointerEnter={() => setOpened(true)}
      onPointerLeave={() => {
        setOpened(false);
        setPointed(undefined);
      }}
      onPointerMove={(event) => {
        const index = under(event);
        setPointed((held) => (held === index ? held : index));
      }}
      onWheel={handOnWheel}
      onClick={go}
      // Over ScrollFade, which would otherwise wash out its foot, and under
      // the island.
      className={cn(
        'fixed top-0 right-0 z-[45] hidden h-dvh cursor-pointer py-24 transition-[width] duration-200 pointer-fine:block motion-reduce:transition-none',
        opened ? 'w-80' : 'w-44'
      )}
    >
      <div ref={field} className="relative h-full">
        {ticks.map((tick, index) => (
          <Tick
            key={index}
            progress={tick.progress}
            section={tick.section}
            pointed={pointed === index}
            reached={reached === index}
            reveal={reveal}
            hide={hide}
            from={share[tick.section ? (order.get(tick.section) ?? 0) : 0]?.from ?? 0}
            to={share[tick.section ? (order.get(tick.section) ?? 0) : 0]?.to ?? 1}
          />
        ))}

        {/* Only the figure rides over the ruler; beside a column of titles it
            is clutter, so it goes while the rail is open. */}
        <motion.span
          style={{ top }}
          // Its own fade, not a slice of a sweep: the taking boundary leaves
          // the giving one where it is, so riding that would bring the figure
          // back in one frame at the end rather than over the close.
          animate={{ opacity: opened ? 0 : 1 }}
          transition={still ? AT_ONCE : FADE}
          className="pointer-events-none absolute right-0 -translate-y-1/2 pr-10 font-mono text-[0.6875rem] tracking-wider text-primary tabular-nums"
        >
          {readout}
        </motion.span>
      </div>
    </div>
  );
}
