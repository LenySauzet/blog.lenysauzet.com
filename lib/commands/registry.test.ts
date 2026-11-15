import { describe, expect, it, vi } from 'vitest';

import { PAGES } from './pages';
import { commands } from './registry';

describe('the accent command', () => {
  const accent = commands.find((command) => command.id === 'accent')!;

  it('is a single row that opens a page of its own', () => {
    expect(commands.filter((command) => command.id.startsWith('tint-'))).toHaveLength(0);
    expect(accent.opens).toBe('accent');
    expect(accent.run).toBeUndefined();
  });

  it('opens a page the palette knows how to dress', () => {
    expect(PAGES[accent.opens!]).toBeDefined();
  });
});

describe('every command that opens a page', () => {
  it('names one the registry holds, and carries no `run` beside it', () => {
    for (const command of commands.filter((candidate) => candidate.opens)) {
      expect(Object.keys(PAGES)).toContain(command.opens);
      expect(command.run).toBeUndefined();
    }
  });
});

describe('Go to top', () => {
  it('scrolls the page itself to its top', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const top = commands.find((command) => command.id === 'go-to-top')!;

    top.run!({} as Parameters<NonNullable<typeof top.run>>[0]);

    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
    scrollTo.mockRestore();
  });
});
