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
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import { useCmdkStore } from '@/hooks/use-cmdk-store';
import { commands } from '@/lib/commands/registry';
import { GROUPS, type Command as PaletteCommand } from '@/lib/commands/types';

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

/** How far the fade reaches once it is fully drawn. */
const FADE = 80;

// Most of the falloff happens in the first third, so a row is gone well before it
// meets the edge rather than half readable against it. Both ends take a 0 to 1
// reach, so the fade grows with the scroll instead of switching on.
const fadeMask = (top: number, bottom: number) => {
  const head = FADE * top;
  const foot = FADE * bottom;

  return [
    'linear-gradient(to bottom',
    'transparent 0',
    `oklch(0 0 0 / 0.35) ${head * 0.4}px`,
    `black ${head}px`,
    `black calc(100% - ${foot}px)`,
    `oklch(0 0 0 / 0.35) calc(100% - ${foot * 0.4}px)`,
    'transparent 100%)',
  ].join(', ');
};

export function CommandPalette() {
  const { isOpen, setIsOpen } = useCmdkStore();
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();

  const listRef = useRef<HTMLElement | null>(null);
  const [edges, setEdges] = useState({ top: 0, bottom: 0 });
  /**
   * cmdk owns the selection, but it refuses to move it onto a disabled row, so
   * pointing at one left the previous row lit and reading as the hovered one.
   * Holding the value here lets a disabled row take the selection like any other:
   * it is dimmed by `data-[disabled=true]:opacity-40` and answers nothing, which is
   * the whole of what disabled has to say.
   */
  const [selected, setSelected] = useState('');

  const context = useMemo(
    () => ({ router, pathname, setTheme, resolvedTheme }),
    [router, pathname, setTheme, resolvedTheme]
  );
  const available = useMemo(
    () => commands.filter((command) => command.when?.(context) ?? true),
    [context]
  );

  // Only ever called from an event, an observer or a ref callback, never from an
  // effect body.
  const readEdges = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const below = list.scrollHeight - list.clientHeight - list.scrollTop;
    setEdges({
      top: Math.min(1, list.scrollTop / FADE),
      bottom: Math.min(1, Math.max(0, below) / FADE),
    });
  }, []);

  /**
   * Wired from the frame's ref rather than an effect: the dialog mounts its content
   * through a portal, so by the time an effect on `isOpen` runs the node is not
   * there yet and the observers were never attached. The scrolling node is found
   * under the frame because a ref handed to `CommandList` does not reach it.
   *
   * Filtering changes what the list holds without changing the list's own box, so
   * its rows are watched too.
   */
  const watchFrame = useCallback(
    (frame: HTMLDivElement | null) => {
      listRef.current = frame?.querySelector<HTMLElement>('[cmdk-list]') ?? null;
      const list = listRef.current;
      if (!list) return;

      const resized = new ResizeObserver(readEdges);
      resized.observe(list);

      const refilled = new MutationObserver(readEdges);
      refilled.observe(list, { childList: true, subtree: true });

      readEdges();
      return () => {
        resized.disconnect();
        refilled.disconnect();
        listRef.current = null;
      };
    },
    [readEdges]
  );

  const runCommand = useCallback(
    (command: PaletteCommand) => {
      if (!useCmdkStore.getState().isOpen) return command.run(context);

      setIsOpen(false);
      window.setTimeout(() => command.run(context), EXIT_MS);
    },
    [context, setIsOpen]
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

  const mask = fadeMask(edges.top, edges.bottom);

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      {/* The dialog here is only the surface: unlike the stock shadcn one it leaves
          the cmdk root to its caller. */}
      <Command value={selected} onValueChange={setSelected}>
        <CommandInput placeholder="Type a command..." />

        <div ref={watchFrame} className="relative">
          {/* Masking the list rather than laying a coloured band over it: the panel
              is glass, so anything opaque would fill in what it is meant to show. */}
          <CommandList
            onScroll={readEdges}
            style={{ maskImage: mask, WebkitMaskImage: mask }}
          >
            <CommandEmpty>Nothing matches that.</CommandEmpty>
            {GROUPS.map((group) => {
              const inGroup = available.filter(
                (command) => command.group === group
              );
              if (!inGroup.length) return null;

              return (
                <CommandGroup key={group} heading={group}>
                  {inGroup.map((command) => {
                    // cmdk matches on this, not on the rendered children.
                    const value = [
                      command.label,
                      ...(command.keywords ?? []),
                    ].join(' ');

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
          </CommandList>

          <EdgeBlur edge="top" reach={edges.top} />
          <EdgeBlur edge="bottom" reach={edges.bottom} />
        </div>
      </Command>
    </CommandDialog>
  );
}

/** Siblings of the masked list: a child would be erased by that same mask. */
function EdgeBlur({ edge, reach }: { edge: 'top' | 'bottom'; reach: number }) {
  const ramp = `linear-gradient(to ${edge === 'top' ? 'bottom' : 'top'}, black 0%, transparent 100%)`;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 h-20 ${
        edge === 'top' ? 'top-0' : 'bottom-0'
      }`}
      style={{
        opacity: reach,
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        maskImage: ramp,
        WebkitMaskImage: ramp,
      }}
    />
  );
}
