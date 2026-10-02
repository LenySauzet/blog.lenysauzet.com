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

import { blurRamp, EASED, fadeToBackground } from '@/components/ScrollFade';
import { scrollProgress } from '@/hooks/use-scroll-tracking';
import { handOnWheel, scrollColumn, travelOf } from '@/lib/scroll-column';
import { cn } from '@/lib/utils';

import { layOutTicks, tickAt } from './rail';
import { Tick } from './Tick';
import { useCascade } from './use-cascade';
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

/**
 * Forgives a wobble at the boundary, and nothing more: the envelope already
 * carries the pointer from one title to the next, so every millisecond here is
 * time in which leaving the rail has visibly done nothing.
 */
const GRACE = 120;

export function ReadingRail() {
  const sections = useSections();
  const field = useRef<HTMLDivElement>(null);
  const leaving = useRef<number>(undefined);
  const [height, setHeight] = useState(0);
  const [opened, setOpened] = useState(false);
  const [pointed, setPointed] = useState<number>();
  const [reached, setReached] = useState(0);
  const [cover, setCover] = useState(0);
  const [reach, setReach] = useState<number[]>([]);
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
      const reaches = [...node.querySelectorAll('span.uppercase')].map((title) =>
        Math.round(right - title.getBoundingClientRect().left)
      );

      setReach(reaches);
      setCover(reaches.length ? Math.max(...reaches) + VEIL_MARGIN : 0);
    });

    return () => cancelAnimationFrame(frame);
  }, [sections, height]);

  const hold = VEIL_SOLID * 100;

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

  /**
   * How far from the edge the rail still answers, at each tick. A title's own
   * reach where there is one, and between two of them the greater of the pair,
   * so the air between neighbours belongs to both. Holding the whole panel
   * instead means crossing all of it to leave; holding the titles alone loses
   * the pointer in the two hundred pixels that can separate them.
   */
  const held = useMemo(() => {
    const own = ticks.map((tick) =>
      tick.section ? (reach[order.get(tick.section) ?? 0] ?? 0) : 0
    );
    const bridged = [...own];

    let carried = 0;
    for (let i = 0; i < own.length; i += 1) {
      carried = own[i] || carried;
      bridged[i] = carried;
    }

    carried = 0;
    for (let i = own.length - 1; i >= 0; i -= 1) {
      carried = own[i] || carried;
      bridged[i] = Math.max(bridged[i], carried);
    }

    return bridged;
  }, [ticks, reach, order]);

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

  const arrive = () => {
    window.clearTimeout(leaving.current);
    setOpened(true);
  };

  const leave = () => {
    window.clearTimeout(leaving.current);
    leaving.current = window.setTimeout(() => {
      setOpened(false);
      setPointed(undefined);
    }, GRACE);
  };

  const depart = (event: React.PointerEvent) => {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;

    leave();
  };

  return (
    <div
      aria-hidden
      onPointerOver={arrive}
      onPointerOut={depart}
      onPointerMove={(event) => {
        const index = under(event);
        setPointed((was) => (was === index ? was : index));

        const edge = event.currentTarget.getBoundingClientRect().right;
        const beyond = edge - event.clientX;

        if (index !== undefined && beyond > (held[index] ?? 0)) leave();
        else window.clearTimeout(leaving.current);
      }}
      onWheel={handOnWheel}
      onClick={go}
      // Closed, the panel answers nothing, so the band at its edge is the only
      // way in and a pointer crossing the page cannot open the rail. Open, it
      // takes the pointer in order to report it: how far the rail still
      // answers is `held`, not this box. Its width never moves either, since
      // animating it re-laid the veil and all fifty ticks on every frame. It
      // is as wide as the longest title and the air beyond, a title reaching
      // past the panel reaching past the veil with it.
      style={{ width: cover || undefined }}
      className={cn(
        'fixed top-0 right-0 z-[45] hidden h-dvh cursor-pointer py-24 pointer-fine:md:block',
        unfolded ? 'pointer-events-auto' : 'pointer-events-none'
      )}
    >
      <div className="pointer-events-auto absolute inset-y-0 right-0 w-12 lg:w-28" />

      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute inset-0"
          style={{
            backdropFilter: backdrop,
            WebkitBackdropFilter: backdrop,
            maskImage: blurRamp('to left', hold, EASED),
            WebkitMaskImage: blurRamp('to left', hold, EASED),
          }}
        />
        <motion.div
          className="absolute inset-0"
          style={{ opacity: veil, background: fadeToBackground('to left', hold, EASED) }}
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
            is clutter, so it goes while the rail is open. */}
        <motion.span
          style={{ top }}
          animate={{ opacity: unfolded ? 0 : 1 }}
          transition={still ? AT_ONCE : FADE}
          className="absolute right-0 -translate-y-1/2 pr-10 font-mono text-[0.6875rem] tracking-wider text-primary tabular-nums"
        >
          {readout}
        </motion.span>
      </div>
    </div>
  );
}
