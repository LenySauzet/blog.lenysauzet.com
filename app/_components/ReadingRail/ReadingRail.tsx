'use client';

import { motion, useReducedMotion, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { scrollProgress, SCROLL_ROOT } from '@/hooks/use-scroll-tracking';
import { cn } from '@/lib/utils';

import { layOutTicks, tickAt, type Tick } from './rail';
import { useSections } from './use-sections';

const SPACING = 14;

export function ReadingRail() {
  const sections = useSections();
  const field = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [opened, setOpened] = useState(false);
  const [pointed, setPointed] = useState<number>();
  const still = useReducedMotion();

  const top = useTransform(scrollProgress, (progress) => `${progress * 100}%`);
  const readout = useTransform(scrollProgress, (progress) => progress.toFixed(2));

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

  /** Read off the event rather than the state the pointer last set: a click
      arriving in the same batch as its move would otherwise act on the tick
      before it. */
  const under = (event: { clientY: number }) => {
    const box = field.current?.getBoundingClientRect();

    return box ? tickAt(count, (event.clientY - box.top) / box.height) : undefined;
  };

  const follow = (event: React.PointerEvent) => {
    const index = under(event);
    setPointed((held) => (held === index ? held : index));
  };

  const go = (event: React.MouseEvent) => {
    const index = under(event);
    const tick: Tick | undefined = index === undefined ? undefined : ticks[index];
    if (!tick) return;

    const behavior = still ? 'auto' : 'smooth';
    const heading = tick.section && document.getElementById(tick.section.id);

    if (heading) return heading.scrollIntoView({ behavior, block: 'start' });

    const column = document.querySelector<HTMLElement>(SCROLL_ROOT);
    column?.scrollTo({
      top: tick.progress * (column.scrollHeight - column.clientHeight),
      behavior,
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
      onPointerMove={follow}
      onClick={go}
      className={cn(
        // Over ScrollFade, which would otherwise wash out its foot, and under
        // the island.
        'fixed top-0 right-0 z-[45] hidden h-dvh cursor-pointer py-6 transition-[width] duration-300 pointer-fine:block motion-reduce:transition-none',
        opened ? 'w-80' : 'w-10'
      )}
    >
      <div ref={field} className="relative h-full">
        {ticks.map((tick, index) => (
          <div
            key={index}
            style={{ top: `${tick.progress * 100}%` }}
            className={cn(
              'absolute right-0 flex -translate-y-1/2 items-center justify-end gap-3 pr-5 transition-transform duration-200 motion-reduce:transition-none',
              pointed === index && tick.section && '-translate-x-1'
            )}
          >
            {tick.section && (
              <span
                className={cn(
                  'font-mono text-[0.6875rem] tracking-wider whitespace-nowrap uppercase transition-[opacity,color] duration-200 motion-reduce:transition-none',
                  opened ? 'opacity-100' : 'opacity-0',
                  pointed === index ? 'text-primary' : 'text-foreground'
                )}
              >
                {tick.section.label}
              </span>
            )}

            <span
              className={cn(
                'h-px transition-[width,background-color] duration-200 motion-reduce:transition-none',
                tick.section ? 'w-4' : 'w-2',
                pointed === index && 'w-5',
                pointed === index && tick.section ? 'bg-primary' : undefined,
                pointed === index && !tick.section ? 'bg-foreground' : undefined,
                pointed !== index && (tick.section ? 'bg-foreground' : 'bg-border')
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
