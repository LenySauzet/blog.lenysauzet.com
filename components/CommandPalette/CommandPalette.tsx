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
  /** 1 into a page, -1 back out of one. */
  const [towards, setTowards] = useState(1);
  const [pane, setPane] = useState<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | 'auto'>('auto');
  const [travelling, setTravelling] = useState(false);
  const [selected, setSelected] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const lastMeasured = useRef<HTMLElement | null>(null);
  const afterExit = useRef<(() => void) | null>(null);
  const runPicked = useCallback(() => {
    const run = afterExit.current;
    afterExit.current = null;
    run?.();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    runPicked();
    input.current?.focus();
  }, [isOpen, runPicked]);

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

  // A frame late: cmdk highlights the first row as the rows mount.
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

  // Reset on the way in: on the way out the root list flicks back into a leaving palette.
  const toRoot = useCallback(() => {
    setTowards(-1);
    setPage(null);
    setQuery('');
    setSelected(rootValues[0] ?? '');
    input.current?.focus();
  }, [rootValues]);

  // Never `setIsOpen` directly: `onOpenChange` fires only for the reader's own dismissals.
  const open = useCallback(() => {
    toRoot();
    setIsOpen(true);
  }, [toRoot, setIsOpen]);

  const close = useCallback(() => setIsOpen(false), [setIsOpen]);

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
        input.current?.focus();
        return;
      }

      if (!useCmdkStore.getState().isOpen) return command.run(context);

      afterExit.current = () => command.run(context);
      close();
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
    <CommandDialog
      open={isOpen}
      onOpenChange={(next) => (next ? open() : close())}
      onExitComplete={runPicked}
    >
      <Command
        value={selected}
        onValueChange={setSelected}
        shouldFilter={page === null || !PAGES[page].ranksItself}
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

        <motion.div
          animate={{ height }}
          initial={false}
          transition={still || !travelling ? AT_ONCE : SWAP}
          // Five `h-11` rows plus the list's padding.
          className="min-h-[14.75rem] overflow-hidden"
        >
          <AnimatePresence mode="wait" initial={false} custom={towards}>
            <motion.div
              ref={setPane}
              key={page ?? 'root'}
              data-pane={page ?? 'root'}
              {...(still
                ? {}
                : {
                    custom: towards,
                    variants: PANE,
                    initial: 'entering',
                    animate: 'settled',
                    exit: 'leaving',
                    transition: SWAP,
                  })}
            >
              {page === 'search' && (
                <PostSearch
                  posts={posts}
                  query={query}
                  onResults={onResults}
                  onPick={(slug) => {
                    afterExit.current = () => router.push(`/posts/${slug}`);
                    close();
                  }}
                />
              )}

              {/* Stays open on a pick, so one accent can be compared with the next. */}
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
