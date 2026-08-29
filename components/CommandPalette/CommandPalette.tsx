'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useCmdkStore } from '@/hooks/use-cmdk-store';
import { commands } from '@/lib/commands/registry';
import { GROUPS } from '@/lib/commands/types';

/** How far the fade reaches, and the slack that keeps it off a resting list. */
const FADE = 44;
const SLACK = 4;

const fadeMask = (top: boolean, bottom: boolean) =>
  `linear-gradient(to bottom, transparent 0, black ${top ? FADE : 0}px, black calc(100% - ${
    bottom ? FADE : 0
  }px), transparent 100%)`;

export function CommandPalette() {
  const { isOpen, setIsOpen } = useCmdkStore();
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();

  const listRef = useRef<HTMLElement | null>(null);
  const [edges, setEdges] = useState({ top: false, bottom: false });

  // Only ever called from an event, an observer or a ref callback, never from an
  // effect body.
  const readEdges = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    setEdges({
      top: list.scrollTop > SLACK,
      bottom: list.scrollTop + list.clientHeight < list.scrollHeight - SLACK,
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'k' || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      setIsOpen(!useCmdkStore.getState().isOpen);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [setIsOpen]);

  const context = { router, pathname, setTheme, resolvedTheme };
  const available = commands.filter((command) => command.when?.(context) ?? true);
  const mask = fadeMask(edges.top, edges.bottom);

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      {/* The dialog here is only the surface: unlike the stock shadcn one it leaves
          the cmdk root to its caller. */}
      <Command>
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
                  {inGroup.map((command) => (
                    <CommandItem
                      key={command.id}
                      // cmdk matches on this, not on the rendered children.
                      value={[command.label, ...(command.keywords ?? [])].join(' ')}
                      disabled={command.disabled}
                      onSelect={() => {
                        setIsOpen(false);
                        command.run(context);
                      }}
                    >
                      <HugeiconsIcon icon={command.icon} strokeWidth={2} />
                      {command.label}
                      {command.hint ? (
                        <span className="ml-auto truncate pl-6 text-sm text-muted-foreground/70">
                          {command.hint}
                        </span>
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>

          <EdgeBlur edge="top" shown={edges.top} />
          <EdgeBlur edge="bottom" shown={edges.bottom} />
        </div>
      </Command>
    </CommandDialog>
  );
}

/** Siblings of the masked list: a child would be erased by that same mask. */
function EdgeBlur({ edge, shown }: { edge: 'top' | 'bottom'; shown: boolean }) {
  const ramp = `linear-gradient(to ${edge === 'top' ? 'bottom' : 'top'}, black 0%, transparent 100%)`;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 h-11 transition-opacity duration-150 ${
        edge === 'top' ? 'top-0' : 'bottom-0'
      } ${shown ? 'opacity-100' : 'opacity-0'}`}
      style={{
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        maskImage: ramp,
        WebkitMaskImage: ramp,
      }}
    />
  );
}
