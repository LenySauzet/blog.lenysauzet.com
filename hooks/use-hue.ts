import { create } from 'zustand';

import { DEFAULT_HUE, hueOf, propertiesOf, STORAGE_KEY } from '@/lib/hues';

type HueStore = {
  /** The accent the reader has settled on. A preview paints over it without
      touching it, so the chooser can show one while the page still holds
      another. */
  hue: string;
  apply: (hue: string) => void;
  setHue: (hue: string) => void;
};

/** Whatever the blocking script in `app/layout.tsx` already painted, so the
    store opens on the colour the reader is looking at rather than on the
    default it would otherwise have to correct. */
const stored = () => {
  if (typeof window === 'undefined') return DEFAULT_HUE.id;

  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_HUE.id;
  } catch {
    return DEFAULT_HUE.id;
  }
};

const paint = (hue: string) => {
  for (const [property, value] of Object.entries(propertiesOf(hueOf(hue)))) {
    document.documentElement.style.setProperty(property, value);
  }
};

export const useHue = create<HueStore>((set) => ({
  hue: stored(),
  apply: paint,
  setHue: (hue: string) => {
    paint(hue);

    // A private window throws rather than returning null, and a reader who
    // blocked storage should still get the colour they just asked for.
    try {
      window.localStorage.setItem(STORAGE_KEY, hue);
    } catch {}

    set({ hue });
  },
}));
