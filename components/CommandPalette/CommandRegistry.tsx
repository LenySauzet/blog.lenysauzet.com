'use client';

import { HugeiconsIcon } from '@hugeicons/react';

import {
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command';
import { GROUPS, type Command } from '@/lib/commands/types';

import { FadingList } from './FadingList';

const KEY_SYMBOLS: Record<string, string> = { ArrowUp: '↑', ArrowDown: '↓' };

const keyLabel = (key: string) => KEY_SYMBOLS[key] ?? key.toUpperCase();

/** What cmdk matches a row on, and addresses it by. Not the rendered children. */
export const commandValue = (command: Command) =>
  [command.label, ...(command.keywords ?? [])].join(' ');

interface CommandRegistryProps {
  recommended: Command[];
  commands: Command[];
  onRun: (command: Command) => void;
  /** cmdk refuses to select a disabled row, so the palette is told to do it. */
  onPointDisabled: (value: string) => void;
}

export function CommandRegistry({
  recommended,
  commands,
  onRun,
  onPointDisabled,
}: CommandRegistryProps) {
  const row = (command: Command) => {
    const value = commandValue(command);

    return (
      <CommandItem
        key={command.id}
        value={value}
        disabled={command.disabled}
        onPointerEnter={command.disabled ? () => onPointDisabled(value) : undefined}
        onSelect={() => onRun(command)}
      >
        <HugeiconsIcon icon={command.icon} strokeWidth={2} />
        {command.label}
        {command.hint && (
          <span className="ml-auto truncate pl-6 text-sm text-muted-foreground/70">
            {command.hint}
          </span>
        )}
        {command.shortcut && (
          <CommandShortcut>⌘{keyLabel(command.shortcut)}</CommandShortcut>
        )}
      </CommandItem>
    );
  };

  return (
    <FadingList>
      <CommandEmpty>Nothing matches that.</CommandEmpty>

      {recommended.length > 0 && (
        <CommandGroup heading="Recommended">{recommended.map(row)}</CommandGroup>
      )}

      {GROUPS.map((group) => {
        const inGroup = commands.filter((command) => command.group === group);
        if (!inGroup.length) return null;

        return (
          <CommandGroup key={group} heading={group}>
            {inGroup.map(row)}
          </CommandGroup>
        );
      })}
    </FadingList>
  );
}
