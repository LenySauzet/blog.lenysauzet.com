import { describe, expect, it } from 'vitest';

import { PAGES } from './pages';
import { commands } from './registry';

describe('the accent command', () => {
  const accent = commands.find((command) => command.id === 'accent')!;

  // Four presets were four rows in `Tools` once. One door is one row, and the
  // choosing happens on the other side of it.
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
