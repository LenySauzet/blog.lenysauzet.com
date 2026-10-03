import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Command } from '@/components/ui/command';
import { HUES } from '@/lib/hues';

import { AccentPicker } from './AccentPicker';

const picker = (current = 'blue', onPick = vi.fn()) => {
  render(
    <Command>
      <AccentPicker current={current} onPick={onPick} />
    </Command>
  );

  return onPick;
};

describe('AccentPicker', () => {
  it('offers every preset', () => {
    picker();

    for (const { label } of HUES) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  // Unlike the root palette, which hides what would change nothing, a chooser
  // has to say where the reader already is.
  it('marks the one in force rather than hiding it', () => {
    picker('teal');

    expect(screen.getByText('Teal')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getAllByText('Current')).toHaveLength(1);
  });

  it('hands back the preset that was picked', async () => {
    const user = userEvent.setup();
    const onPick = picker();

    await user.click(screen.getByText('Amber'));

    expect(onPick).toHaveBeenCalledWith(HUES.find((hue) => hue.id === 'amber'));
  });
});
