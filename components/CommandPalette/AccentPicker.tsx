'use client';

import { CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { accentOf, HUES, type Hue } from '@/lib/hues';

import { FadingList } from './FadingList';

/** The figure, in pixels, so the cut lands where the front disc actually is.
    `w-5 h-4` and `size-3.5` below are the same numbers in Tailwind's units. */
const DISC = 14;
const OVERLAP = 8;
/** What the page shows through between the two, in place of a stroke: a border
    would be a colour that has to match whatever is behind it, and this has to
    hold on a panel, in either theme, at any accent. */
const CUT = 1.5;

/**
 * The colour the preset will produce, not a token: written at the preset's own
 * angle, the swatch says what it does before anything is picked. Two discs,
 * because one flat dot reads as a bullet at this size.
 *
 * The disc behind is mixed into the page rather than laid over it at an alpha:
 * an alpha composites against whatever surface it lands on, and this one has
 * to hold on a panel in either theme.
 */
function Swatch({ preset }: { preset: Hue }) {
  const accent = accentOf(preset);
  const cut = `radial-gradient(circle at ${DISC - OVERLAP + DISC / 2}px ${DISC / 2}px, transparent ${DISC / 2 + CUT}px, black ${DISC / 2 + CUT}px)`;

  return (
    <span aria-hidden className="relative flex h-4 w-5 shrink-0 items-center">
      <span
        className="absolute left-0 size-3.5 rounded-full"
        style={{
          background: `color-mix(in oklab, ${accent} 45%, var(--background))`,
          maskImage: cut,
          WebkitMaskImage: cut,
        }}
      />
      <span
        className="absolute right-0 size-3.5 rounded-full"
        style={{ background: accent }}
      />
    </span>
  );
}

interface AccentPickerProps {
  /** The preset in force, which the list marks rather than hides: a chooser
      shows where you are, where the root palette only offers what would
      change something. */
  current: string;
  onPick: (hue: Hue) => void;
}

export function AccentPicker({ current, onPick }: AccentPickerProps) {
  return (
    <FadingList>
      <CommandEmpty>No accent by that name.</CommandEmpty>

      <CommandGroup heading="Accent">
        {HUES.map((preset) => (
          <CommandItem
            key={preset.id}
            value={preset.id}
            onSelect={() => onPick(preset)}
          >
            <Swatch preset={preset} />
            {preset.label}
            {preset.id === current && (
              <span className="ml-auto truncate pl-6 text-sm text-muted-foreground/70">
                Current
              </span>
            )}
          </CommandItem>
        ))}
      </CommandGroup>
    </FadingList>
  );
}
