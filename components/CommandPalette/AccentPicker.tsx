'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import {
  CommandEmpty,
  CommandGroup,
  CommandHint,
  commandHint,
  CommandItem,
} from '@/components/ui/command';
import { accentOf, HUES, type Hue } from '@/lib/hues';

import { FadingList } from './FadingList';

/** `h-4 w-5` and `size-3.5` below, in the pixels the cut has to be written in. */
const DISC = 14;
const OVERLAP = 8;
const CUT = 1.5;

/** A mask rather than a stroke: a border would be a colour that has to match
    whatever sits behind it, in either theme, under any accent. */
const CUT_OUT = `radial-gradient(circle at ${DISC - OVERLAP + DISC / 2}px ${DISC / 2}px, transparent ${DISC / 2 + CUT}px, black ${DISC / 2 + CUT}px)`;

/** The colour the preset will produce, written at its own angle. The disc
    behind is mixed into the page rather than laid over it at an alpha, which
    would composite against whatever surface it lands on. */
function Swatch({ preset }: { preset: Hue }) {
  const accent = accentOf(preset);

  return (
    <span aria-hidden className="relative flex h-4 w-5 shrink-0 items-center">
      <span
        className="absolute left-0 size-3.5 rounded-full"
        style={{
          background: `color-mix(in oklab, ${accent} 45%, var(--background))`,
          maskImage: CUT_OUT,
          WebkitMaskImage: CUT_OUT,
        }}
      />
      <span
        className="absolute right-0 size-3.5 rounded-full"
        style={{ background: accent }}
      />
    </span>
  );
}

const LETTER = {
  hidden: { opacity: 0, filter: 'blur(6px)' },
  shown: { opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } },
};

/** `ZoomCaption`'s grammar. Leaving mirrors arriving, last letter first, so
    the mark hands over to the row that takes it. */
const WORD = {
  hidden: {},
  shown: { transition: { delayChildren: 0.04, staggerChildren: 0.03 } },
  gone: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
};

function Mark({ children }: { children: string }) {
  const still = useReducedMotion();

  if (still) return <CommandHint>{children}</CommandHint>;

  return (
    <motion.span
      data-slot="command-hint"
      className={commandHint}
      variants={WORD}
      initial="hidden"
      animate="shown"
      exit="gone"
    >
      {/* `inline-block` keeps the blur off each glyph's own spacing. */}
      {[...children].map((letter, index) => (
        <motion.span key={index} variants={LETTER} className="inline-block">
          {letter}
        </motion.span>
      ))}
    </motion.span>
  );
}

interface AccentPickerProps {
  /** Marked rather than hidden: a chooser says where you are, where the root
      palette only offers what would change something. */
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
            <AnimatePresence>
              {preset.id === current && <Mark key="mark">Current</Mark>}
            </AnimatePresence>
          </CommandItem>
        ))}
      </CommandGroup>
    </FadingList>
  );
}
