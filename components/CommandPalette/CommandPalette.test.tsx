import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useCmdkStore } from '@/hooks/use-cmdk-store';
import { commands } from '@/lib/commands/registry';
import { GROUPS } from '@/lib/commands/types';

import { CommandPalette } from './CommandPalette';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const setTheme = vi.fn();
vi.mock('next-themes', () => ({
  useTheme: () => ({ setTheme, resolvedTheme: 'dark' }),
}));

afterEach(() => {
  useCmdkStore.setState({ isOpen: false });
  vi.clearAllMocks();
});

describe('CommandPalette', () => {
  it('stays out of the way until it is asked for', () => {
    render(<CommandPalette />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens on the shortcut and closes on it again', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard('{Meta>}k{/Meta}');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Meta>}k{/Meta}');
    expect(useCmdkStore.getState().isOpen).toBe(false);
  });

  it('offers every command in the registry, under its own heading', async () => {
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette />);

    for (const group of GROUPS) {
      expect(await screen.findByText(group)).toBeInTheDocument();
    }
    for (const command of commands) {
      expect(screen.getByText(command.label)).toBeInTheDocument();
    }
  });

  // The registry decides what a command does; the palette only has to hand it the
  // page's router and theme, and get out of the way afterwards.
  it('runs the command it is given and closes behind it', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette />);

    await user.click(await screen.findByText('Home'));

    expect(push).toHaveBeenCalledWith('/');
    expect(useCmdkStore.getState().isOpen).toBe(false);
  });

  it('toggles away from the theme currently resolved', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette />);

    await user.click(await screen.findByText('Toggle theme'));

    expect(setTheme).toHaveBeenCalledWith('light');
  });

  // Typing a word the label does not contain still has to find the command.
  it('matches on keywords as well as labels', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette />);

    await user.type(await screen.findByRole('combobox'), 'donate');

    expect(screen.getByText('Support me')).toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });
});
