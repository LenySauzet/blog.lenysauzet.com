'use client';

import { motion, useReducedMotion, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { scrollProgress } from '@/hooks/use-scroll-tracking';
import { handOnWheel, scrollColumn, travelOf } from '@/lib/scroll-column';
import { cn } from '@/lib/utils';

import { layOutTicks, tickAt, type Section } from './rail';
import { useSections } from './use-sections';

const SPACING = 14;
const STAGGER = 0.025;

const REVEAL = { duration: 0.3, ease: [0.22, 0.61, 0.36, 1] } as const;

/** Length alone carries the heading; the whole ruler lengthens once the rail is
    open. The two tones say section or not, and nothing else: one colour at two
    weights, since the text tiers swap places between the themes and would
    invert the order in light. */
const WIDTH = {
  closed: { plain: 'w-2', 3: 'w-3', 2: 'w-4' },
  open: { plain: 'w-3', 3: 'w-4', 2: 'w-5' },
} as const;

const tickOf = (opened: boolean, section?: Section) => {
  const width = WIDTH[opened ? 'open' : 'closed'];

  return section
    ? cn(section.level === 3 ? width[3] : width[2], 'bg-muted-foreground')
    : cn(width.plain, 'bg-muted-foreground/30');
};

export function ReadingRail() {
  const sections = useSections();
  const field = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [opened, setOpened] = useState(false);
  const [pointed, setPointed] = useState<number>();
  const still = useReducedMotion();

  useEffect(() => {
    const node = field.current;
    if (!node) return;

    const resized = new ResizeObserver(([entry]) =>
      setHeight(entry.contentRect.height)
    );
    resized.observe(node);

    return () => resized.disconnect();
  }, []);

  const count = Math.floor(height / SPACING);
  const ticks = layOutTicks(count, sections);
  const order = new Map(sections.map((section, index) => [section, index]));

  // The ticks are the anchors, so the mark rests on one rather than sliding
  // between them: the reader scrolls a little and it steps.
  const anchored = useTransform(scrollProgress, (progress) =>
    count < 2 ? 0 : tickAt(count, progress) / (count - 1)
  );
  const top = useTransform(anchored, (progress) => `${progress * 100}%`);
  const readout = useTransform(anchored, (progress) => progress.toFixed(2));

  const under = (event: { clientY: number }) => {
    const box = field.current?.getBoundingClientRect();

    return box ? tickAt(count, (event.clientY - box.top) / box.height) : undefined;
  };

  const go = (event: React.MouseEvent) => {
    const index = under(event);
    const tick = index === undefined ? undefined : ticks[index];
    if (!tick) return;

    const column = scrollColumn();
    if (!column) return;

    column.scrollTo({
      top: tick.section ? tick.section.top : tick.progress * travelOf(column),
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
        'fixed top-0 right-0 z-[45] hidden h-dvh cursor-pointer py-24 transition-[width] duration-300 pointer-fine:block motion-reduce:transition-none',
        opened ? 'w-80' : 'w-44'
      )}
    >
      <div ref={field} className="relative h-full">
        {ticks.map((tick, index) => (
          <div
            key={index}
            style={{ top: `${tick.progress * 100}%` }}
            className="absolute right-0 flex -translate-y-1/2 items-center justify-end gap-3 pr-5"
          >
            {tick.section && (
              <motion.span
                initial={false}
                animate={{
                  opacity: opened ? 1 : 0,
                  filter: opened ? 'blur(0px)' : 'blur(6px)',
                }}
                transition={
                  still
                    ? { duration: 0 }
                    : { ...REVEAL, delay: (order.get(tick.section) ?? 0) * STAGGER }
                }
                // The colour is not transitioned: eased, a quick pass over
                // several sections answers none of them.
                className={cn(
                  'font-mono text-[0.6875rem] tracking-wider whitespace-nowrap text-foreground uppercase transition-[translate] duration-200 motion-reduce:transition-none',
                  pointed === index && '-translate-x-1 text-primary'
                )}
              >
                {tick.section.label}
              </motion.span>
            )}

            <span
              className={cn(
                'h-px transition-[width] duration-300 motion-reduce:transition-none',
                tickOf(opened, tick.section),
                pointed === index && 'bg-foreground'
              )}
            />
          </div>
        ))}

        <motion.div
          style={{ top }}
          className="pointer-events-none absolute right-0 flex -translate-y-1/2 items-center justify-end gap-3 pr-5"
        >
          {/* The mark stays, since it is where the reader is; the figure goes,
              since beside a column of titles it is only clutter. */}
          <motion.span
            animate={{ opacity: opened ? 0 : 1 }}
            transition={still ? { duration: 0 } : REVEAL}
            className="font-mono text-[0.6875rem] tracking-wider text-primary tabular-nums"
          >
            {readout}
          </motion.span>
          <span
            className={cn(
              'h-px bg-primary transition-[width] duration-300 motion-reduce:transition-none',
              opened ? WIDTH.open[2] : WIDTH.closed[2]
            )}
          />
        </motion.div>
      </div>
    </div>
  );
}
