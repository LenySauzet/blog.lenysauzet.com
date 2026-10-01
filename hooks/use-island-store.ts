import { create } from 'zustand';

import type { IslandPost, IslandState } from '@/app/_components/DynamicIsland/types';

/**
 * A state raised by an event rather than derived from the page. It covers whatever
 * ambient state is current and, on expiry, uncovers it again: a reader who was
 * three quarters through an article finds their progress where they left it.
 */
interface Presented {
  state: IslandState;
  /** What `dismiss` and the timer identify it by. */
  id: string;
}

interface PresentOptions {
  /** How long before it hands the island back. Absent means until dismissed. */
  ttl?: number;
}

interface IslandStore {
  /** Last in wins, so a second event covers the first rather than fighting it. */
  presented: Presented[];
  /** Set by the post being read, cleared when it unmounts. */
  post: IslandPost | null;
  present: (state: IslandState, options?: PresentOptions) => void;
  dismiss: (id: string) => void;
  setPost: (post: IslandPost | null) => void;
}

/**
 * What each raised state is waiting on. Held outside the store because it is
 * bookkeeping rather than state: nothing renders from it, and renewing an
 * announcement has to cancel the timer the first one left behind or the second
 * would be dismissed on the first one's schedule.
 */
const expiries = new Map<string, number>();

export const useIslandStore = create<IslandStore>((set, get) => ({
  presented: [],
  post: null,

  present: (state, { ttl } = {}) => {
    // Raising a state twice renews it rather than stacking two copies: the second
    // "link copied" is the same announcement, not a queue of them.
    window.clearTimeout(expiries.get(state.id));
    expiries.delete(state.id);

    set({
      presented: [
        ...get().presented.filter((entry) => entry.id !== state.id),
        { state, id: state.id },
      ],
    });

    if (ttl) {
      expiries.set(
        state.id,
        window.setTimeout(() => get().dismiss(state.id), ttl)
      );
    }
  },

  dismiss: (id) => {
    window.clearTimeout(expiries.get(id));
    expiries.delete(id);
    set({ presented: get().presented.filter((entry) => entry.id !== id) });
  },

  setPost: (post) => set({ post }),
}));
