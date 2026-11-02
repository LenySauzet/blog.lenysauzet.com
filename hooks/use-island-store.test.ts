import { afterEach, describe, expect, it, vi } from 'vitest';

import type { IslandState } from '@/app/_components/DynamicIsland/types';

import { useIslandStore } from './use-island-store';

const state: IslandState = { id: 'probe', render: () => null };

afterEach(() => useIslandStore.setState({ presented: [] }));

describe('useIslandStore', () => {
  it('dismisses what it presented', () => {
    useIslandStore.getState().present(state);

    useIslandStore.getState().dismiss('probe');

    expect(useIslandStore.getState().presented).toEqual([]);
  });

  // The island dismisses its hint on every hover.
  it('tells no one when there was nothing to dismiss', () => {
    const listener = vi.fn();
    const unsubscribe = useIslandStore.subscribe(listener);

    useIslandStore.getState().dismiss('probe');

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});
