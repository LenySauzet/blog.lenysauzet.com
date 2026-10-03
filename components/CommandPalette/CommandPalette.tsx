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
 * One pane at a time, `mode="wait"` holding the next until the last has gone:
 * a page is a `CommandList`, and two of them inside one `Command` would have
 * cmdk ranking and arrowing through rows nobody can see.
 *
 * The blur is the movement's own, so it resolves to `none` rather than resting
 * at `blur(0)`, which would leave every pane holding a composited layer.
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

export function CommandPalette({ slugs }: { slugs: string[] }) {
  const { isOpen, setIsOpen } = useCmdkStore();
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const { hue, setHue } = useHue();
  const { atTop, finished } = useScrollTracking();

  const still = useReducedMotion();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState<Page | null>(null);
  /** Which way the panes travel: into a page, or back out of one. State and
      not a ref, the variants reading it as they render. */
  const [towards, setTowards] = useState(1);
  const [pane, setPane] = useState<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | 'auto'>('auto');
  /** A swap travels; filtering does not. Typing narrows the list, and a box
      that eases down to meet it and back up again reads as the dialog
      breathing rather than as rows going away. */
  const [travelling, setTravelling] = useState(false);
  const [selected, setSelected] = useState('');
  const input = useRef<HTMLInputElement>(null);

  /**
   * Only the pane that is arriving is measured. Entering a page clears the box
   * as well, so the pane on its way out re-renders unfiltered and swells back
   * to its full height first: followed, the dialog grew to meet a list nobody
   * would see and then dropped to the page's own size.
   */
  useEffect(() => {
    if (!pane || pane.dataset.pane !== (page ?? 'root')) return;

    // The first reading from a pane is the swap and travels; everything after
    // it is the list filtering under a box that should simply follow. Held
    // here rather than cleared when the animation ends, which never fires for
    // two panes that happen to be the same height.
    let arriving = true;

    const resized = new ResizeObserver(([entry]) => {
      setTravelling(arriving && height !== 'auto');
      arriving = false;
      setHeight(entry.contentRect.height);
    });
    resized.observe(pane);

    return () => resized.disconnect();
    // `height` is read to tell the palette opening from a swap, and following
    // it would re-arm the travel on every measurement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pane, page]);

  /** The chooser opens on the accent in force, so the reader starts from where
      they are rather than at the top of an alphabet. */
  useEffect(() => {
    if (page !== 'accent' || !isOpen) return;

    // A frame later: cmdk puts its own highlight on the first row as the rows
    // mount, and setting this during the effect only to have that land on top
    // leaves the chooser pointing at a colour the reader is not on.
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
    // Clicked rather than typed, the way back is a button that leaves with the
    // page it belongs to: focus would be left on nothing and the keyboard with
    // nowhere to go.
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

        {/* The box travels with its contents. Two panes can differ by a couple
            of hundred pixels, and left alone the dialog takes that in a single
            frame, in the middle of an otherwise smooth swap. `layout` is the
            wrong tool: it transforms the element and leaves the real box to
            jump, which is what the dialog sizes itself to. So the height is
            measured off the pane and animated for real, and it holds through
            the gap between one pane leaving and the next arriving, the
            observer having nothing to watch there. */}
        <motion.div
          animate={{ height }}
          initial={false}
          transition={still || !travelling ? AT_ONCE : SWAP}
          className="overflow-hidden"
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
                  query={query}
                  onResults={onResults}
                  onPick={(slug) => {
                    close();
                    window.setTimeout(() => router.push(`/posts/${slug}`), EXIT_MS);
                  }}
                />
              )}

              {/* Applied in place, and the page stays: every other command acts
                  and the palette shuts behind it, but a chooser has to let one
                  accent be compared with the next. The whole surface rethemes
                  under the reader's eyes, which is the answer. */}
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
