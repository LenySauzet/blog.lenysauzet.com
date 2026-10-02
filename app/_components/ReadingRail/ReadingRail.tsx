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
import { passDuration, useCascade } from './use-cascade';
import { LANDING, useSections } from './use-sections';

const SPACING = 14;

const VEIL_BLUR = 14;

/** Air kept beyond the longest title, which the panel has to be wide enough
    for: a title reaching past the panel reaches past the veil with it. */
const VEIL_MARGIN = 120;

/** The share of the panel the veil holds at full before it begins to fall. The
    rest is ramp, and it is most of it: the blur carries legibility under a
    title long before the colour has to, so holding the colour as far as the
    longest title leaves a flat slab where a dissolve belongs. */
const VEIL_SOLID = 0.28;

const FADE = { duration: 0.3, ease: [0.22, 0.61, 0.36, 1] } as const;
const VEIL = { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] } as const;
const AT_ONCE = { duration: 0 } as const;

/** The titles leave on their own cascade, so the veil waits for them. */
const EXIT_DELAY = 0.45;

export function ReadingRail() {
  const sections = useSections();
  const field = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [opened, setOpened] = useState(false);
  const [pointed, setPointed] = useState<number>();
  const [reached, setReached] = useState(0);
  const [widest, setWidest] = useState(0);
  const still = useReducedMotion();

  // Most posts carry no heading, and an empty drawer has no reason to open.
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
  const order = useMemo(
    () => new Map(sections.map((section, index) => [section, index])),
    [sections]
  );

  const cascade = useCascade(sections.length, unfolded, Boolean(still));
  const veil = useMotionValue(0);

  useEffect(() => {
    const running = animate(
      veil,
      unfolded ? 1 : 0,
      still ? AT_ONCE : { ...VEIL, delay: unfolded ? 0 : EXIT_DELAY }
    );

    return () => running.stop();
  }, [unfolded, still, veil]);

  // Measured rather than chosen: the veil has to reach past the longest title
  // there is, and the panel past the veil, or a long one hangs over the column
  // with the text legible straight through it.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const node = field.current;
      if (!node) return;

      const right = node.getBoundingClientRect().right;
      const reaches = [...node.querySelectorAll('span.uppercase')].map(
        (title) => right - title.getBoundingClientRect().left
      );

      setWidest(reaches.length ? Math.round(Math.max(...reaches)) : 0);
    });

    return () => cancelAnimationFrame(frame);
  }, [sections, height]);

  const ramp = blurRamp('to left', VEIL_SOLID * 100, EASED);

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
      // The panel itself never answers the pointer: the two boxes below are
      // the whole of what does, so what the rail reacts to is a shape the
      // browser hit-tests rather than a threshold read on every move. Its
      // width never moves either, since animating it re-laid the veil and all
      // fifty ticks on every frame. It is as wide as the longest title and the
      // air beyond, a title reaching past the panel reaching past the veil
      // with it.
      style={{ width: widest ? widest + VEIL_MARGIN : undefined }}
      className="pointer-events-none fixed top-0 right-0 z-[45] hidden h-dvh cursor-pointer py-24 pointer-fine:md:block"
    >
      {/* The way in, and the only one: a band narrow enough that a pointer
          crossing the page cannot open the rail. */}
      <div className="pointer-events-auto absolute inset-y-0 right-0 w-12 lg:w-28" />

      {/* What holds it open, once it is: the reach of the longest title and
          not a pixel more, so leaving is one straight edge to cross at any
          height. The veil is wider, being a picture rather than a target. */}
      <div
        style={{ width: widest || undefined }}
        className={cn(
          'absolute inset-y-0 right-0',
          unfolded ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      />

      {/* Gone from `xl` up, where it has nothing left to cover: measured on
          this layout, no content passes under the part of the veil that is
          more than a fifth opaque from 1180 on, and from 1280 a title no
          longer crosses the column at all. What remained there was its own
          quantisation, faint but moving while it animates.

          Both layers carry the ramp as a mask, the colour one over a flat
          fill rather than as a gradient of alphas. Painted as a gradient it
          bands: over an empty page the colour layer is `--background` on
          `--background` and should be invisible, and instead it laid down
          steps of about one part in 255 that read as a seam. Measured against
          the page beside it, the worst column-to-column step falls from 0.97
          to 0.10 while what it hides is unchanged, 33.159 against 33.167. */}
      <div className="pointer-events-none absolute inset-0 xl:hidden">
        <motion.div
          className="absolute inset-0"
          style={{
            backdropFilter: backdrop,
            WebkitBackdropFilter: backdrop,
            maskImage: ramp,
            WebkitMaskImage: ramp,
          }}
        />
        <motion.div
          className="absolute inset-0 bg-background"
          style={{ opacity: veil, maskImage: ramp, WebkitMaskImage: ramp }}
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
            shown={tick.section ? cascade[order.get(tick.section) ?? 0] : undefined}
          />
        ))}

        {/* Only the figure rides over the ruler; beside a column of titles it
            is clutter, so it goes while the rail is open. Coming back it waits
            for the titles to be gone, which is the cascade's business to say
            and not a delay of its own choosing: the walk is paced per title,
            so a long post empties later than a short one. */}
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
