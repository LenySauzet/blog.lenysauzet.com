'use client';

import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Command, CommandDialog, CommandInput } from '@/components/ui/command';
import { useCmdkStore } from '@/hooks/use-cmdk-store';
import { commands } from '@/lib/commands/registry';
import { GROUPS, type Command as PaletteCommand, type Page } from '@/lib/commands/types';

import { CommandRegistry, commandValue } from './CommandRegistry';
import { PostSearch } from './PostSearch';

/**
 * What the surface takes to leave, matching the dialog's own `duration-100`. A
 * command that repaints the page inside that window reads as a cut rather than an
 * exit. A timer and not `animationend`, which never fires when animation is off.
 */
const EXIT_MS = 120;

const PLACEHOLDERS: Record<Page, string> = { search: 'Search blog posts...' };

export function CommandPalette() {
  const { isOpen, setIsOpen } = useCmdkStore();
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();

  const [query, setQuery] = useState('');
  const [page, setPage] = useState<Page | null>(null);
  const [selected, setSelected] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const context = useMemo(
    () => ({ router, pathname, setTheme, resolvedTheme }),
    [router, pathname, setTheme, resolvedTheme]
  );
  const available = useMemo(
    () => commands.filter((command) => command.when?.(context) ?? true),
    [context]
  );
  const rootValues = useMemo(
    () =>
      GROUPS.flatMap((group) =>
        available.filter((command) => command.group === group).map(commandValue)
      ),
    [available]
  );

  /**
   * Where the palette starts, and returns to when a page is left. Named on the way
   * in: resetting on the way out would show the root list flick back into a palette
   * that is already leaving.
   */
  const toRoot = useCallback(() => {
    setPage(null);
    setQuery('');
    setSelected(rootValues[0] ?? '');
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
        shouldFilter={page === null}
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
          placeholder={page ? PLACEHOLDERS[page] : 'Type a command...'}
        />

        {page === 'search' ? (
          <PostSearch
            key="search"
            query={query}
            onResults={onResults}
            onPick={(slug) => {
              close();
              window.setTimeout(() => router.push(`/posts/${slug}`), EXIT_MS);
            }}
          />
        ) : (
          <CommandRegistry
            key="root"
            commands={available}
            onRun={runCommand}
            onPointDisabled={setSelected}
          />
        )}
      </Command>
    </CommandDialog>
  );
}
