'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Command, CommandDialog, CommandInput } from '@/components/ui/command';
import { useCmdkStore } from '@/hooks/use-cmdk-store';
import { useHue } from '@/hooks/use-hue';
import { useScrollTracking } from '@/hooks/use-scroll-tracking';
import { PAGES } from '@/lib/commands/pages';
import { partitionByRecommendation } from '@/lib/commands/recommend';
import { commands } from '@/lib/commands/registry';
import { GROUPS, type Command as PaletteCommand, type Page } from '@/lib/commands/types';
import type { PostSummary } from '@/lib/post-utils';

import { AccentPicker } from './AccentPicker';
import { BackHint } from './BackHint';
import { CommandRegistry, commandValue } from './CommandRegistry';
import { PostSearch } from './PostSearch';

/**
 * What the surface takes to leave, matching the dialog's own `duration-100`. A
 * command that repaints the page inside that window reads as a cut rather than an
 * exit. A timer and not `animationend`, which never fires when animation is off.
 */
const EXIT_MS = 120;

/**
 * One pane at a time: a page is a `CommandList`, and two inside one `Command`
 * have cmdk ranking and arrowing through rows nobody can see. The blur
 * resolves to `none`, or every pane holds a composited layer.
 */
const TRAVEL = 28;
const SMEAR = 7;

const PANE = {
  entering: (towards: number) => ({
    x: towards * TRAVEL,
    opacity: 0,
    filter: `blur(${SMEAR}px)`,
  }),
  settled: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transitionEnd: { filter: 'none' },
  },
  leaving: (towards: number) => ({
    x: -towards * TRAVEL,
    opacity: 0,
    filter: `blur(${SMEAR}px)`,
  }),
};

const SWAP = { duration: 0.16, ease: [0.22, 0.61, 0.36, 1] } as const;
const AT_ONCE = { duration: 0 } as const;

export function CommandPalette({ posts }: { posts: PostSummary[] }) {
  const slugs = useMemo(() => posts.map((post) => post.slug), [posts]);
  const { isOpen, setIsOpen } = useCmdkStore();
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const { hue, setHue } = useHue();
  const { atTop, finished } = useScrollTracking();

  const still = useReducedMotion();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState<Page | null>(null);
  /** Which way the panes travel: into a page, or back out of one. */
  const [towards, setTowards] = useState(1);
  const [pane, setPane] = useState<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | 'auto'>('auto');
  const [travelling, setTravelling] = useState(false);
  const [selected, setSelected] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const lastMeasured = useRef<HTMLElement | null>(null);

  /**
   * The arriving pane only: entering a page clears the box too, so the one on
   * its way out swells back to full height first. A box the size of a pane it
   * has not measured before is a swap and travels; the same pane resizing
   * again is the list filtering, and follows at once.
   */
  useEffect(() => {
    if (!pane || pane.dataset.pane !== (page ?? 'root')) return;

    const resized = new ResizeObserver(([entry]) => {
      setTravelling(lastMeasured.current !== null && lastMeasured.current !== pane);
      lastMeasured.current = pane;
      setHeight(entry.contentRect.height);
    });
    resized.observe(pane);

    return () => resized.disconnect();
  }, [pane, page]);

  /** The chooser opens on the accent in force. A frame late, cmdk laying its
      own highlight on the first row as the rows mount. */
  useEffect(() => {
    if (page !== 'accent' || !isOpen) return;

    const frame = requestAnimationFrame(() => setSelected(useHue.getState().hue));

    return () => cancelAnimationFrame(frame);
  }, [page, isOpen]);

  const context = useMemo(
    () => ({ router, pathname, setTheme, resolvedTheme, hue, setHue, slugs, atTop, finished }),
    [router, pathname, setTheme, resolvedTheme, hue, setHue, slugs, atTop, finished]
  );
  const { recommended, rest } = useMemo(
    () =>
      partitionByRecommendation(
        commands.filter((command) => command.when?.(context) ?? true),
        context
      ),
    [context]
  );
  const available = useMemo(() => [...recommended, ...rest], [recommended, rest]);
  const rootValues = useMemo(
    () => [
      ...recommended.map(commandValue),
      ...GROUPS.flatMap((group) =>
        rest.filter((command) => command.group === group).map(commandValue)
      ),
    ],
    [recommended, rest]
  );

  /**
   * Where the palette starts, and returns to when a page is left. Named on the way
   * in: resetting on the way out would show the root list flick back into a palette
   * that is already leaving.
   */
  const toRoot = useCallback(() => {
    setTowards(-1);
    setPage(null);
    setQuery('');
    setSelected(rootValues[0] ?? '');
    // The way back is a button that leaves with the page it belongs to, so
    // the focus it took has to be handed somewhere.
    input.current?.focus();
  }, [rootValues]);

  /**
   * Opening and closing go through these, never through `setIsOpen`. A controlled
   * dialog fires `onOpenChange` for the reader's own dismissals and nothing else, so
   * a command closing the palette itself would skip everything hung off it.
   */
  const open = useCallback(() => {
    toRoot();
    setIsOpen(true);
  }, [toRoot, setIsOpen]);

  const close = useCallback(() => setIsOpen(false), [setIsOpen]);

  /** The selection follows the rows a page ranks for itself. */
  const onResults = useCallback((values: string[]) => {
    setSelected((current) =>
      values.includes(current) ? current : (values[0] ?? '')
    );
  }, []);

  const runCommand = useCallback(
    (command: PaletteCommand) => {
      if (command.opens) {
        setQuery('');
        setTowards(1);
        setPage(command.opens);
        // A row reached with the mouse keeps the focus it was given, and the page
        // it opens is a search box.
        input.current?.focus();
        return;
      }

      if (!useCmdkStore.getState().isOpen) return command.run(context);

      close();
      window.setTimeout(() => command.run(context), EXIT_MS);
    },
    [close, context]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) return;

      if (event.key === 'k') {
        event.preventDefault();
        if (useCmdkStore.getState().isOpen) close();
        else open();
        return;
      }

      const wanted = available.find(
        (command) =>
          command.shortcut && !command.disabled && command.shortcut === event.key
      );
      if (!wanted) return;

      event.preventDefault();
      runCommand(wanted);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [available, close, open, runCommand]);

  return (
    <CommandDialog open={isOpen} onOpenChange={(next) => (next ? open() : close())}>
      <Command
        value={selected}
        onValueChange={setSelected}
        shouldFilter={page === null || !PAGES[page].ranksItself}
        // Backspace on an empty box leaves a page, the way a breadcrumb would be
        // clicked. Read on the root: a row reached with the mouse holds the focus,
        // and the key would never reach the box.
        onKeyDown={(event) => {
          if (page && event.key === 'Backspace' && query === '') toRoot();
        }}
      >
        <CommandInput
          ref={input}
          value={query}
          onValueChange={setQuery}
          placeholder={page ? PAGES[page].placeholder : 'Type a command...'}
          hint={<BackHint shown={page !== null && query === ''} onBack={toRoot} />}
        />

        {/* The box travels with its contents, by a measured height rather
            than `layout`, which transforms the element and leaves the real
            box to jump. */}
        <motion.div
          animate={{ height }}
          initial={false}
          transition={still || !travelling ? AT_ONCE : SWAP}
          // Five rows of `h-11` plus the list's padding: filtered to one
          // command the box fell to a single row and climbed back out.
          className="min-h-[14.75rem] overflow-hidden"
        >
          <AnimatePresence mode="wait" initial={false} custom={towards}>
            <motion.div
              ref={setPane}
              key={page ?? 'root'}
              data-pane={page ?? 'root'}
              custom={towards}
              variants={PANE}
              initial="entering"
              animate="settled"
              exit="leaving"
              transition={still ? AT_ONCE : SWAP}
            >
              {page === 'search' && (
                <PostSearch
                  posts={posts}
                  query={query}
                  onResults={onResults}
                  onPick={(slug) => {
                    close();
                    window.setTimeout(() => router.push(`/posts/${slug}`), EXIT_MS);
                  }}
                />
              )}

              {/* The page stays where every other command shuts it: a
                  chooser has to let one accent be compared with the next. */}
              {page === 'accent' && (
                <AccentPicker current={hue} onPick={(preset) => setHue(preset.id)} />
              )}

              {page === null && (
                <CommandRegistry
                  recommended={recommended}
                  commands={rest}
                  onRun={runCommand}
                  onPointDisabled={setSelected}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </Command>
    </CommandDialog>
  );
}
