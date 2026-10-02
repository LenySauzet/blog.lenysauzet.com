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

/** One colour at three weights rather than three tokens: the text tiers swap
    places between the themes, which would invert the ruler's own hierarchy. */
const TICK = {
  plain: 'w-2 bg-muted-foreground/30',
  3: 'w-3 bg-muted-foreground/60',
  2: 'w-4 bg-muted-foreground',
} as const;

const lengthOf = (section?: Section) =>
  section ? (TICK[section.level === 3 ? 3 : 2] ?? TICK[2]) : TICK.plain;

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
                className={cn(
                  'font-mono text-[0.6875rem] tracking-wider whitespace-nowrap uppercase transition-[color,translate] duration-200 motion-reduce:transition-none',
                  tick.section.level === 3 ? 'text-muted-foreground' : 'text-foreground',
                  pointed === index && '-translate-x-1 text-primary'
                )}
              >
                {tick.section.label}
              </motion.span>
            )}

            <span
              className={cn(
                'h-px transition-colors duration-200 motion-reduce:transition-none',
                lengthOf(tick.section),
                pointed === index && 'bg-foreground'
              )}
            />
          </div>
        ))}

        {/* The sections are what the reader came to the rail for; the mark would
            only compete with them. */}
        <motion.div
          style={{ top }}
          animate={{ opacity: opened ? 0 : 1 }}
          transition={still ? { duration: 0 } : REVEAL}
          className="pointer-events-none absolute right-0 flex -translate-y-1/2 items-center justify-end gap-3 pr-5"
        >
          <motion.span className="font-mono text-[0.6875rem] tracking-wider text-primary tabular-nums">
            {readout}
          </motion.span>
          <span className="h-px w-4 bg-primary" />
        </motion.div>
      </div>
    </div>
  );
}
