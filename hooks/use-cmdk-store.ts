import { create } from 'zustand';

type CmdkStore = {
  isOpen: boolean;
  /** True only while the closing palette hands its focus back. */
  returningFocus: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export const useCmdkStore = create<CmdkStore>((set) => ({
  isOpen: false,
  returningFocus: false,
  setIsOpen: (isOpen: boolean) => {
    set({ isOpen });
  },
}));
