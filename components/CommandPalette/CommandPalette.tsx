'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command';
import { useCmdkStore } from '@/hooks/use-cmdk-store';
import { commands } from '@/lib/commands/registry';
import {
  GROUPS,
  type Command as PaletteCommand,
  type Page,
} from '@/lib/commands/types';

import { FadingList } from './FadingList';
import { PostSearch } from './PostSearch';

/**
 * What the surface takes to leave, matching the dialog's own `duration-100`. A
 * command that repaints the whole page inside that window reads as a cut rather than
 * an exit, so the two are kept apart. A timer rather than `animationend`, which never
 * fires when the animation is off and would drop the command entirely.
 */
const EXIT_MS = 120;

/** What the shortcut column shows after the modifier. */
const KEY_SYMBOLS: Record<string, string> = { ArrowUp: '↑', ArrowDown: '↓' };

const keyLabel = (key: string) => KEY_SYMBOLS[key] ?? key.toUpperCase();

const PLACEHOLDERS: Record<Page, string> = { search: 'Search blog posts...' };

/** What cmdk matches a row on, and addresses it by. Not the rendered children. */
const commandValue = (command: PaletteCommand) =>
  [command.label, ...(command.keywords ?? [])].join(' ');

export function CommandPalette() {
  const { isOpen, setIsOpen } = useCmdkStore();
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();

  const [query, setQuery] = useState('');
  const [page, setPage] = useState<Page | null>(null);
  /**
   * cmdk owns the selection, but it refuses to move it onto a disabled row, so
   * pointing at one left the previous row lit and reading as the hovered one.
   * Holding the value here lets a disabled row take the selection like any other:
   * it is dimmed by `data-[disabled=true]:opacity-40` and answers nothing, which is
   * the whole of what disabled has to say.
   */
  const [selected, setSelected] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const context = useMemo(
    () => ({ router, pathname, setTheme, resolvedTheme }),
    [router, pathname, setTheme, resolvedTheme]
  );
  const available = useMemo(
    () => commands.filter((command) => command.when?.(context) ?? true),
    [context]
  );
  /** The rows of the root list, in the order they are drawn. */
  const rootValues = useMemo(
    () =>
      GROUPS.flatMap((group) =>
        available.filter((command) => command.group === group).map(commandValue)
      ),
    [available]
  );

  const close = useCallback(() => setIsOpen(false), [setIsOpen]);

  // The selection follows the rows a page ranks for itself: kept where it is while
  // it still stands, and dropped to the top of the list once it does not.
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
        // A row clicked with the mouse holds the focus it was given, and the page
        // it opened is a search box: typing has to land somewhere.
        inputRef.current?.focus();
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
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setIsOpen(!useCmdkStore.getState().isOpen);
        return;
      }

      if (!event.metaKey && !event.ctrlKey) return;

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
  }, [available, runCommand, setIsOpen]);

  // A palette reopened is a palette at its root: a page left standing from last time
  // is not where anyone means to start.
  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setPage(null);
      setQuery('');
    }
  };

  const leavePage = () => {
    setPage(null);
    setQuery('');
    // The root list fills back up without the search box changing, and that box is
    // the one thing cmdk watches, so the row to land on is named here.
    setSelected(rootValues[0] ?? '');
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
      {/* The dialog here is only the surface: unlike the stock shadcn one it leaves
          the cmdk root to its caller. A page ranks its own results, so cmdk is told
          to score nothing while one is open. */}
      <Command
        value={selected}
        onValueChange={setSelected}
        shouldFilter={page === null}
        // Backspace on an empty box is how a page is left, the way a breadcrumb
        // would be clicked. Escape stays what it is everywhere else: gone.
        //
        // Read on the root rather than on the input: a row reached with the mouse
        // leaves the focus on itself, and the key would never reach the box.
        onKeyDown={(event) => {
          if (page && event.key === 'Backspace' && query === '') leavePage();
        }}
      >
        <CommandInput
          ref={inputRef}
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
          <FadingList key="root">
            <CommandEmpty>Nothing matches that.</CommandEmpty>
            {GROUPS.map((group) => {
              const inGroup = available.filter(
                (command) => command.group === group
              );
              if (!inGroup.length) return null;

              return (
                <CommandGroup key={group} heading={group}>
                  {inGroup.map((command) => {
                    const value = commandValue(command);

                    return (
                      <CommandItem
                        key={command.id}
                        value={value}
                        disabled={command.disabled}
                        // `onPointerMove` is what cmdk selects on, and it overrides
                        // ours with `undefined` on a disabled row.
                        onPointerEnter={
                          command.disabled ? () => setSelected(value) : undefined
                        }
                        onSelect={() => runCommand(command)}
                      >
                        <HugeiconsIcon icon={command.icon} strokeWidth={2} />
                        {command.label}
                        {command.hint ? (
                          <span className="ml-auto truncate pl-6 text-sm text-muted-foreground/70">
                            {command.hint}
                          </span>
                        ) : null}
                        {command.shortcut ? (
                          <CommandShortcut>
                            ⌘{keyLabel(command.shortcut)}
                          </CommandShortcut>
                        ) : null}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
          </FadingList>
        )}
      </Command>
    </CommandDialog>
  );
}
