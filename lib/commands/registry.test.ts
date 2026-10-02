import { describe, expect, it, vi } from 'vitest';

import { HUES } from '@/lib/hues';

import { commands } from './registry';
import type { CommandContext } from './types';

const tints = commands.filter((command) => command.id.startsWith('tint-'));

const context = (hue: string) => ({ hue, setHue: vi.fn() }) as unknown as CommandContext;

describe('the tint commands', () => {
  it('offers one per preset', () => {
    expect(tints).toHaveLength(HUES.length);
    expect(tints.map((t) => t.id)).toEqual(HUES.map((h) => `tint-${h.id}`));
  });

  // The palette offers what would change something, the way `Go to top` is not
  // offered to a reader already there.
  it('withholds the one already in force', () => {
    for (const { id } of HUES) {
      const offered = tints.filter((tint) => tint.when?.(context(id)) ?? true);

      expect(offered.map((tint) => tint.id)).not.toContain(`tint-${id}`);
      expect(offered).toHaveLength(HUES.length - 1);
    }
  });

  it('sets the preset it names, and nothing else', () => {
    for (const { id } of HUES) {
      const held = context('violet');

      tints.find((tint) => tint.id === `tint-${id}`)!.run?.(held);

      expect(held.setHue).toHaveBeenCalledWith(id);
    }
  });
});
