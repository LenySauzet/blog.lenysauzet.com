import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MiniSearch from 'minisearch';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCmdkStore } from '@/hooks/use-cmdk-store';
import { useHue } from '@/hooks/use-hue';
import { commands } from '@/lib/commands/registry';
import { GROUPS } from '@/lib/commands/types';
import { HUES } from '@/lib/hues';
import { INDEX_OPTIONS } from '@/lib/search/config';

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

let column: HTMLElement;

beforeEach(() => {
  column = document.createElement('div');
  column.setAttribute('data-scroll-root', '');
  document.body.append(column);
});

afterEach(() => {
  column.remove();
  useCmdkStore.setState({ isOpen: false });
  pathname = '/';
  vi.clearAllMocks();
});

const readTo = (fraction: number) => {
  Object.defineProperty(column, 'scrollHeight', { value: 1000, configurable: true });
  Object.defineProperty(column, 'clientHeight', { value: 500, configurable: true });
  Object.defineProperty(column, 'scrollTop', {
    value: Math.round(500 * fraction),
    configurable: true,
  });
  fireEvent.scroll(column);
};

const shown = () =>
  screen.getAllByRole('option').map((item) => item.textContent?.trim());

const posts = [
  { slug: 'halftone', title: 'Shades of Halftone', description: 'Dots.', date: '2026-04-22' },
  { slug: 'planets', title: 'Procedural Planets', description: 'Spheres.', date: '2026-04-21' },
];

describe('CommandPalette', () => {
  it('stays out of the way until it is asked for', () => {
    render(<CommandPalette posts={posts} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens on the shortcut and closes on it again', async () => {
    const user = userEvent.setup();
    render(<CommandPalette posts={posts} />);

    await user.keyboard('{Meta>}k{/Meta}');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Meta>}k{/Meta}');
    expect(useCmdkStore.getState().isOpen).toBe(false);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('marks a palette the keyboard is driving, until a touch', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);
    const root = (await screen.findByRole('combobox')).closest('[data-slot="command"]')!;
    expect(root).not.toHaveAttribute('data-keyed');

    await user.keyboard('t');
    expect(root).toHaveAttribute('data-keyed');

    fireEvent.pointerDown(root);
    expect(root).not.toHaveAttribute('data-keyed');
  });

  it('offers every command that suits the page, under its own heading', async () => {
    pathname = '/posts/anything';
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);
    readTo(0.5);

    for (const group of GROUPS) {
      expect(await screen.findByText(group)).toBeInTheDocument();
    }
    for (const command of commands) {
      expect(screen.getByText(command.label)).toBeInTheDocument();
    }
  });

  it('opens the accent page, with the one in force marked', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);

    await user.click(await screen.findByText('Change the accent'));

    expect(await screen.findByPlaceholderText('Pick an accent...')).toBeInTheDocument();
    for (const { label } of HUES) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    const inForce = HUES.find((preset) => preset.id === useHue.getState().hue)!;
    expect(screen.getByText(inForce.label)).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('opens the chooser on the accent already in force', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    useHue.setState({ hue: 'teal' });
    render(<CommandPalette posts={posts} />);

    await user.click(await screen.findByText('Change the accent'));

    const row = (await screen.findByText('Teal')).closest('[cmdk-item]');
    await waitFor(() => expect(row).toHaveAttribute('data-selected', 'true'));
  });

  it('says how to get back, and only while that is what the key does', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);

    expect(screen.queryByText(/Back/)).not.toBeInTheDocument();

    await user.click(await screen.findByText('Change the accent'));
    expect(await screen.findByText(/Back/)).toBeInTheDocument();

    await user.keyboard('te');
    await waitFor(() => expect(screen.queryByText(/Back/)).not.toBeInTheDocument());
  });

  it('goes back when the hint is clicked, and hands the box its focus', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);

    await user.click(await screen.findByText('Change the accent'));
    await user.click(await screen.findByRole('button', { name: /Back/ }));

    const box = await screen.findByPlaceholderText('Type a command...');
    expect(box).toBeInTheDocument();
    expect(box).toHaveFocus();
  });

  it('comes back to the root from a page', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);

    await user.click(await screen.findByText('Change the accent'));
    await screen.findByPlaceholderText('Pick an accent...');

    await user.keyboard('{Backspace}');

    expect(await screen.findByPlaceholderText('Type a command...')).toBeInTheDocument();
  });

  it('keeps the post-only commands off every other page', async () => {
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);
    await screen.findByText('Home');

    expect(shown()).not.toContain('Copy link to clipboard');
    expect(shown()).not.toContain('Go to top');
  });

  it('withholds the way back up from a reader already at the top', async () => {
    pathname = '/posts/shades-of-halftone';
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);
    await screen.findByText('Copy link to clipboard');

    expect(screen.queryByText('Go to top')).not.toBeInTheDocument();

    readTo(0.5);

    expect(await screen.findByText('Go to top')).toBeInTheDocument();
  });

  it('recommends finding something to read, on the index', async () => {
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);

    expect(await screen.findByText('Recommended')).toBeInTheDocument();

    const group = screen
      .getByText('Recommended')
      .closest('[cmdk-group]') as HTMLElement;
    const offered = [...group.querySelectorAll('[role="option"]')].map(
      (row) => row.textContent?.split('\n')[0]
    );

    expect(offered).toEqual(['Search blog posts', 'Read a random post']);
  });

  it('names the way onward once the article runs out', async () => {
    pathname = '/posts/shades-of-halftone';
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);
    await screen.findByText('Home');

    expect(screen.queryByText('Recommended')).not.toBeInTheDocument();

    readTo(1);

    expect(await screen.findByText('Recommended')).toBeInTheDocument();
    const headings = [...document.querySelectorAll('[cmdk-group-heading]')].map(
      (heading) => heading.textContent
    );
    expect(headings[0]).toBe('Recommended');
  });

  it('leaves no copy behind in the group it was lifted from', async () => {
    pathname = '/posts/shades-of-halftone';
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);
    readTo(1);
    await screen.findByText('Recommended');

    expect(screen.getAllByText('Home')).toHaveLength(1);
    expect(screen.getAllByText('Support me')).toHaveLength(1);
  });

  it('offers them again inside an article', async () => {
    pathname = '/posts/shades-of-halftone';
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);
    readTo(0.5);

    expect(await screen.findByText('Copy link to clipboard')).toBeInTheDocument();
    expect(screen.getByText('Go to top')).toBeInTheDocument();
  });

  it('shows the glossary without letting it be run', async () => {
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);

    const glossary = await screen.findByText('Glossary');
    expect(glossary.closest('[role="option"]')).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    expect(push).not.toHaveBeenCalled();
  });

  it('closes first, then runs the command it was given', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);

    await user.click(await screen.findByText('Home'));

    expect(useCmdkStore.getState().isOpen).toBe(false);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/'));
  });

  it('toggles away from the theme currently resolved', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);

    await user.click(await screen.findByText('Toggle theme'));

    await waitFor(() => expect(setTheme).toHaveBeenCalledWith('light'));
  });

  it('runs a command from its shortcut with the palette shut', async () => {
    const user = userEvent.setup();
    render(<CommandPalette posts={posts} />);

    await user.keyboard('{Meta>}d{/Meta}');

    await waitFor(() => expect(setTheme).toHaveBeenCalledWith('light'));
  });

  it('is gone before the theme sweep takes its snapshot', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);

    await user.click(await screen.findByText('Toggle theme'));

    expect(useCmdkStore.getState().isOpen).toBe(false);
    expect(setTheme).not.toHaveBeenCalled();
    await waitFor(() => expect(setTheme).toHaveBeenCalledWith('light'));
  });

  it('runs a row once, however often Enter lands while it leaves', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);

    await user.type(await screen.findByRole('combobox'), 'toggle theme');
    await user.keyboard('{Enter}{Enter}{Enter}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(setTheme).toHaveBeenCalledTimes(1);
  });

  it('runs what was picked at once when reopened before it has left', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);

    await user.click(await screen.findByText('Toggle theme'));
    act(() => useCmdkStore.setState({ isOpen: true }));
    expect(setTheme).toHaveBeenCalledTimes(1);

    act(() => useCmdkStore.setState({ isOpen: false }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(setTheme).toHaveBeenCalledTimes(1);
  });

  // jsdom ignores `inert` for focus, so the test plays the browser's part.
  it('takes the keyboard again when reopened before it has left', async () => {
    const focus = HTMLElement.prototype.focus;
    const refused = vi
      .spyOn(HTMLElement.prototype, 'focus')
      .mockImplementation(function (this: HTMLElement, options) {
        if (!this.closest('[inert]')) focus.call(this, options);
      });
    try {
      const user = userEvent.setup();
      useCmdkStore.setState({ isOpen: true });
      render(<CommandPalette posts={posts} />);

      await user.click(await screen.findByText('Toggle theme'));
      act(() => screen.getByRole('combobox').blur());
      await user.keyboard('{Meta>}k{/Meta}');

      await waitFor(() => expect(screen.getByRole('combobox')).toHaveFocus());
    } finally {
      refused.mockRestore();
    }
  });

  it('hands the focus back to what held it once it has left', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <CommandPalette posts={posts} />
      </>
    );
    screen.getByRole('button', { name: 'Before' }).focus();

    await user.keyboard('{Meta>}k{/Meta}');
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
  });

  it('takes the selection off the last row when a disabled one is pointed at', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);

    const row = (label: string) =>
      screen.getByText(label).closest('[role="option"]');

    await user.hover(await screen.findByText('RSS'));
    expect(row('RSS')).toHaveAttribute('data-selected', 'true');

    await user.hover(screen.getByText('Glossary'));

    expect(row('RSS')).toHaveAttribute('data-selected', 'false');
    expect(row('Glossary')).toHaveAttribute('data-selected', 'true');
  });

  it('turns into the search page rather than running and leaving', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);

    await user.click(await screen.findByText('Search blog posts'));

    expect(useCmdkStore.getState().isOpen).toBe(true);
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'placeholder',
      'Search blog posts...'
    );
    expect(await screen.findByText('Shades of Halftone')).toBeInTheDocument();
  });

  it('leaves the page on a backspace with nothing left to delete', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);

    await user.click(await screen.findByText('Search blog posts'));
    await screen.findByText('Shades of Halftone');
    await user.type(screen.getByRole('combobox'), 'a{backspace}{backspace}');

    expect(screen.getByRole('combobox')).toHaveAttribute(
      'placeholder',
      'Type a command...'
    );
    expect(screen.getByText('Toggle theme')).toBeInTheDocument();
  });

  it('reopens at its root after a post was picked from the search page', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);

    await user.click(await screen.findByText('Search blog posts'));
    await user.type(screen.getByRole('combobox'), 'halftone');
    await user.click(await screen.findByText('Shades of Halftone'));
    await waitFor(() => expect(useCmdkStore.getState().isOpen).toBe(false));

    await user.keyboard('{Meta>}k{/Meta}');

    const input = await screen.findByRole('combobox');
    expect(input).toHaveAttribute('placeholder', 'Type a command...');
    expect(input).toHaveValue('');
    expect(screen.getByText('Toggle theme')).toBeInTheDocument();
  });

  it('matches on keywords as well as labels', async () => {
    const user = userEvent.setup();
    useCmdkStore.setState({ isOpen: true });
    render(<CommandPalette posts={posts} />);

    await user.type(await screen.findByRole('combobox'), 'donate');

    expect(screen.getByText('Support me')).toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });
});
