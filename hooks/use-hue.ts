import { create } from 'zustand';

import { DEFAULT_HUE, hueOf, propertiesOf, STORAGE_KEY } from '@/lib/theme/hues';

type HueStore = {
  hue: string;
  setHue: (hue: string) => void;
};

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

/** Paints the stored accent without saving it, so the default never becomes a choice. */
export const paintStoredHue = () => paint(stored());

export const useHue = create<HueStore>((set) => ({
  hue: stored(),
  setHue: (hue: string) => {
    paint(hue);

    // A private window throws rather than returning null.
    try {
      window.localStorage.setItem(STORAGE_KEY, hue);
    } catch {}

    set({ hue });
  },
}));
