'use client';

import { motion, useReducedMotion, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { scrollProgress } from '@/hooks/use-scroll-tracking';
import { handOnWheel, scrollColumn, travelOf } from '@/lib/scroll-column';
import { cn } from '@/lib/utils';

import { layOutTicks, tickAt } from './rail';
import { useSections } from './use-sections';

const SPACING = 14;
const STAGGER = 0.025;

const REVEAL = { duration: 0.3, ease: [0.22, 0.61, 0.36, 1] } as const;

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
  const order = new Map(sections.map((section, index) => [section.id, index]));

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

    const behavior = still ? 'auto' : 'smooth';
    const heading = tick.section && document.getElementById(tick.section.id);

    if (heading) return heading.scrollIntoView({ behavior, block: 'start' });

    const column = scrollColumn();
    column?.scrollTo({ top: tick.progress * travelOf(column), behavior });
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
                    : { ...REVEAL, delay: (order.get(tick.section.id) ?? 0) * STAGGER }
                }
                className={cn(
                  'font-mono text-[0.6875rem] tracking-wider whitespace-nowrap uppercase transition-[color,translate] duration-200 motion-reduce:transition-none',
                  pointed === index ? '-translate-x-1 text-primary' : 'text-foreground'
                )}
              >
                {tick.section.label}
              </motion.span>
            )}

            <span
              className={cn(
                'h-px transition-colors duration-200 motion-reduce:transition-none',
                tick.section ? 'w-4 bg-muted-foreground' : 'w-2 bg-subtle-foreground',
                pointed === index && 'bg-foreground'
              )}
            />
          </div>
        ))}

        <motion.div
          style={{ top }}
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
