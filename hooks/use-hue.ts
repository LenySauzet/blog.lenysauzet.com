import { create } from 'zustand';

import { DEFAULT_HUE, hueOf, propertiesOf, STORAGE_KEY } from '@/lib/hues';

type HueStore = {
  hue: string;
  setHue: (hue: string) => void;
};

/** Whatever the blocking script in `app/layout.tsx` already painted. */
const stored = () => {
  if (typeof window === 'undefined') return DEFAULT_HUE.id;

  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_HUE.id;
  } catch {
    return DEFAULT_HUE.id;
  }
};

export const useHue = create<HueStore>((set) => ({
  hue: stored(),
  setHue: (hue: string) => {
    for (const [property, value] of Object.entries(propertiesOf(hueOf(hue)))) {
      document.documentElement.style.setProperty(property, value);
    }

    // A private window throws rather than returning null, and the colour
    // just asked for should land either way.
    try {
      window.localStorage.setItem(STORAGE_KEY, hue);
    } catch {}

    set({ hue });
  },
}));
