import { create } from 'zustand';

interface LightboxStore {
  /** How many lightboxes cover the page. */
  open: number;
  /** Counts one more open; the returned function counts it closed. */
  cover: () => () => void;
}

export const useLightboxStore = create<LightboxStore>((set) => ({
  open: 0,
  cover: () => {
    set((state) => ({ open: state.open + 1 }));
    return () => set((state) => ({ open: state.open - 1 }));
  },
}));
