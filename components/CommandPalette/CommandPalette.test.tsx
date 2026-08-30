import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MiniSearch from 'minisearch';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { INDEX_OPTIONS } from '@/lib/search/config';

import { useCmdkStore } from '@/hooks/use-cmdk-store';
import { commands } from '@/lib/commands/registry';
import { GROUPS } from '@/lib/commands/types';

import { CommandPalette } from './CommandPalette';

const push = vi.fn();
let pathname = '/';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname,
}));

const setTheme = vi.fn();
vi.mock('next-themes', () => ({
  useTheme: () => ({ setTheme, resolvedTheme: 'dark' }),
}));

const index = new MiniSearch(INDEX_OPTIONS);
index.add({
  slug: 'halftone',
  title: 'Shades of Halftone',
  description: 'Dots on a grid.',
  tags: 'glsl',
  date: '2026-04-22',
  text: 'The dot pattern is an optical illusion.',
});
vi.mock('@/lib/search/load-index', () => ({
  loadSearchIndex: () => Promise.resolve(index),
}));

afterEach(() => {
  useCmdkStore.setState({ isOpen: false });
  pathname = '/';
  vi.clearAllMocks();
});

const shown = () =>
  screen.getAllByRole('option').map((item) => item.textContent?.trim());

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

  it('offers every command that suits the page, under its own heading', async () => {
    pathname = '/posts/anything';
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette />);

    for (const group of GROUPS) {
      expect(await screen.findByText(group)).toBeInTheDocument();
    }
    for (const command of commands) {
      expect(screen.getByText(command.label)).toBeInTheDocument();
    }
  });

  // Copying a link or scrolling back up is meaningless on the index, and an offer
  // that does nothing is worse than no offer.
  it('keeps the post-only commands off every other page', async () => {
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette />);
    await screen.findByText('Home');

    expect(shown()).not.toContain('Copy link to clipboard');
    expect(shown()).not.toContain('Go to top');
  });

  it('offers them again inside an article', async () => {
    pathname = '/posts/shades-of-halftone';
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette />);

    expect(await screen.findByText('Copy link to clipboard')).toBeInTheDocument();
    expect(screen.getByText('Go to top')).toBeInTheDocument();
  });

  // Listed so the shape of the site is visible, inert until the page exists.
  it('shows the glossary without letting it be run', async () => {
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette />);

    const glossary = await screen.findByText('Glossary');
    expect(glossary.closest('[role="option"]')).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    expect(push).not.toHaveBeenCalled();
  });

  // The registry decides what a command does; the palette hands it the page's router
  // and theme, and lets the surface leave first: a command that repaints the whole
  // page during the exit makes it read as a cut.
  it('closes first, then runs the command it was given', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette />);

    await user.click(await screen.findByText('Home'));

    expect(useCmdkStore.getState().isOpen).toBe(false);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
  });

  it('toggles away from the theme currently resolved', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette />);

    await user.click(await screen.findByText('Toggle theme'));

    await waitFor(() => expect(setTheme).toHaveBeenCalledWith('light'));
  });

  // Answers from anywhere, so it is worth something before the palette is known.
  it('runs a command from its shortcut with the palette shut', async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard('{Meta>}d{/Meta}');

    await waitFor(() => expect(setTheme).toHaveBeenCalledWith('light'));
  });

  // The sweep snapshots the whole page for its length, so it has to start once the
  // palette has left rather than freeze it mid-exit.
  it('is gone before the theme sweep takes its snapshot', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette />);

    await user.click(await screen.findByText('Toggle theme'));

    expect(useCmdkStore.getState().isOpen).toBe(false);
    expect(setTheme).not.toHaveBeenCalled();
    await waitFor(() => expect(setTheme).toHaveBeenCalledWith('light'));
  });

  // cmdk refuses to move its selection onto a disabled row, which left whichever row
  // held it lit and reading as the one under the cursor.
  it('takes the selection off the last row when a disabled one is pointed at', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette />);

    const row = (label: string) =>
      screen.getByText(label).closest('[role="option"]');

    await user.hover(await screen.findByText('RSS'));
    expect(row('RSS')).toHaveAttribute('data-selected', 'true');

    await user.hover(screen.getByText('Glossary'));

    expect(row('RSS')).toHaveAttribute('data-selected', 'false');
    expect(row('Glossary')).toHaveAttribute('data-selected', 'true');
  });

  // A page is the one thing that does not act on the site, so the palette stays.
  it('turns into the search page rather than running and leaving', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette />);

    await user.click(await screen.findByText('Search blog posts'));

    expect(useCmdkStore.getState().isOpen).toBe(true);
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'placeholder',
      'Search blog posts...'
    );
    expect(await screen.findByText('Shades of Halftone')).toBeInTheDocument();
  });

  // The way back, since the palette shows no breadcrumb to click.
  it('leaves the page on a backspace with nothing left to delete', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette />);

    await user.click(await screen.findByText('Search blog posts'));
    await screen.findByText('Shades of Halftone');
    await user.type(screen.getByRole('combobox'), 'a{backspace}{backspace}');

    expect(screen.getByRole('combobox')).toHaveAttribute(
      'placeholder',
      'Type a command...'
    );
    expect(screen.getByText('Toggle theme')).toBeInTheDocument();
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
