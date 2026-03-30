import { create } from 'zustand';

type SplashScreenStore = {
  isVisible: boolean;
  setVisibility: (isVisible: boolean) => void;
};

export const useSplashScreenStore = create<SplashScreenStore>((set) => ({
  isVisible: true,
  setVisibility: (isVisible: boolean) => set({ isVisible }),
}));
