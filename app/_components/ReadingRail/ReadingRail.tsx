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

import { blurRamp, fadeToBackground } from '@/components/ScrollFade';
import { scrollProgress } from '@/hooks/use-scroll-tracking';
import { handOnWheel, scrollColumn, travelOf } from '@/lib/scroll-column';
import { cn } from '@/lib/utils';

import { layOutTicks, tickAt } from './rail';
import { useCascade } from './use-cascade';
import { Tick } from './Tick';
import { LANDING, useSections } from './use-sections';

const SPACING = 14;
const VEIL_BLUR = 14;

/** Air kept beyond the longest title, before the veil begins to ramp. */
const VEIL_MARGIN = 28;

/** And the run the veil ramps over, which the panel has to be wide enough for. */
const VEIL_RAMP = 120;

/** The titles leave on their own cascade, so the veil waits for them. */
const VEIL_EXIT_DELAY = 0.35;

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

  // Most posts carry no heading, and an empty drawer has no reason to open.
  const unfolded = opened && sections.length > 0;
  const cascade = useCascade(sections.length, unfolded, Boolean(still));

  const veil = useMotionValue(0);
  const [cover, setCover] = useState(0);

  useEffect(() => {
    const running = animate(
      veil,
      unfolded ? 1 : 0,
      still ? AT_ONCE : { ...VEIL, delay: unfolded ? 0 : VEIL_EXIT_DELAY }
    );

    return () => running.stop();
  }, [unfolded, still, veil]);

  // Measured rather than chosen: the veil has to reach past the longest title
  // there is, and a share of the panel leaves the long ones hanging over the
  // column with the text still legible under them.
  useEffect(() => {
    // After the frame the titles are laid out in, which is the only one where
    // their widths are worth reading.
    const frame = requestAnimationFrame(() => {
      const node = field.current;
      if (!node) return;

      const right = node.getBoundingClientRect().right;
      const widest = [...node.querySelectorAll('span')].reduce(
        (reach, title) => Math.max(reach, right - title.getBoundingClientRect().left),
        0
      );

      setCover(widest ? Math.round(widest + VEIL_MARGIN) : 0);
    });

    return () => cancelAnimationFrame(frame);
  }, [sections, height]);

  // The radius is what travels, not the layer's opacity: a blurred layer is
  // already as good as fully blurred at half opacity, so fading it in jumps.
  // `none` at rest, since a backdrop filter re-blurs its backdrop every frame
  // it is mounted, even at no radius at all.
  const backdrop = useTransform(veil, (shown) =>
    shown === 0 ? 'none' : `blur(${(shown * VEIL_BLUR).toFixed(2)}px)`
  );

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
      // The reach is a narrow band at the edge, never the width of the open
      // panel: a strip with no paint on it still takes the clicks of whatever
      // it lies over, and one wide enough to meet a long title opens the rail
      // on a pointer that was only crossing the page. Under `md` the gutter is
      // 16px, which is no target at all. Over ScrollFade, which would otherwise
      // wash out its foot, and under the island.
      // Wide enough for its longest title and the veil's ramp beyond it, since
      // a title reaching past the panel reaches past the veil with it.
      style={{ width: unfolded ? cover + VEIL_RAMP : undefined }}
      className={cn(
        'fixed top-0 right-0 z-[45] hidden h-dvh cursor-pointer py-24 transition-[width] duration-200 motion-reduce:transition-none pointer-fine:md:block',
        !unfolded && 'w-12 lg:w-20'
      )}
    >
      {/* The open panel lies over the column, so the column dissolves under it
          rather than reading through the titles. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute inset-0"
          style={{
            backdropFilter: backdrop,
            WebkitBackdropFilter: backdrop,
            maskImage: blurRamp('to left', `${cover}px`),
            WebkitMaskImage: blurRamp('to left', `${cover}px`),
          }}
        />
        <motion.div
          className="absolute inset-0"
          style={{ opacity: veil, background: fadeToBackground('to left', `${cover}px`) }}
        />
      </div>

      <div ref={field} className="relative h-full">
        {ticks.map((tick, index) => (
          <Tick
            key={index}
            progress={tick.progress}
            section={tick.section}
            pointed={pointed === index}
            reached={reached === index}
            shown={tick.section ? cascade[order.get(tick.section) ?? 0] : undefined}
          />
        ))}

        {/* Only the figure rides over the ruler; beside a column of titles it
            is clutter, so it goes while the rail is open. */}
        <motion.span
          style={{ top }}
          // Its own fade: it is not one of the titles, and nothing about it
          // belongs to their cascade.
          animate={{ opacity: unfolded ? 0 : 1 }}
          transition={still ? AT_ONCE : FADE}
          className="pointer-events-none absolute right-0 -translate-y-1/2 pr-10 font-mono text-[0.6875rem] tracking-wider text-primary tabular-nums"
        >
          {readout}
        </motion.span>
      </div>
    </div>
  );
}
