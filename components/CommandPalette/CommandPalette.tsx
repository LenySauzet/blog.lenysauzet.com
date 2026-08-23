"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useCmdkStore } from "@/hooks/use-cmdk-store";
import { commands } from "@/lib/commands/registry";
import { GROUPS } from "@/lib/commands/types";

export function CommandPalette() {
  const { isOpen, setIsOpen } = useCmdkStore();
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "k" || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      setIsOpen(!useCmdkStore.getState().isOpen);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setIsOpen]);

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      {/* The dialog here is only the surface: unlike the stock shadcn one it leaves
          the cmdk root to its caller. */}
      <Command>
        <CommandInput placeholder="Type a command..." />
        <CommandList>
          <CommandEmpty>Nothing matches that.</CommandEmpty>
          {GROUPS.map((group) => {
            const inGroup = commands.filter(
              (command) => command.group === group,
            );
            if (!inGroup.length) return null;

            return (
              <CommandGroup key={group} heading={group}>
                {inGroup.map((command) => (
                  <CommandItem
                    key={command.id}
                    // cmdk matches on this, not on the rendered children.
                    value={[command.label, ...(command.keywords ?? [])].join(
                      " ",
                    )}
                    onSelect={() => {
                      setIsOpen(false);
                      command.run({ router, setTheme, resolvedTheme });
                    }}
                  >
                    <HugeiconsIcon icon={command.icon} strokeWidth={2} />
                    {command.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
