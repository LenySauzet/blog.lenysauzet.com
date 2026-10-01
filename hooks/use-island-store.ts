import { create } from 'zustand';

import type { IslandPost, IslandState } from '@/app/_components/DynamicIsland/types';

interface PresentOptions {
  ttl?: number;
}

interface IslandStore {
  presented: IslandState[];
  post: IslandPost | null;
  present: (state: IslandState, options?: PresentOptions) => void;
  dismiss: (id: string) => void;
  setPost: (post: IslandPost | null) => void;
}

const expiries = new Map<string, number>();

const renew = (id: string) => {
  window.clearTimeout(expiries.get(id));
  expiries.delete(id);
};

export const useIslandStore = create<IslandStore>((set, get) => ({
  presented: [],
  post: null,

  present: (state, { ttl } = {}) => {
    renew(state.id);

    set({
      presented: [
        ...get().presented.filter((raised) => raised.id !== state.id),
        state,
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
    renew(id);
    set({ presented: get().presented.filter((raised) => raised.id !== id) });
  },

  setPost: (post) => set({ post }),
}));
