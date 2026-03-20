import { create } from 'zustand';

type CmdkStore = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export const useCmdkStore = create<CmdkStore>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen: boolean) => {
    set({ isOpen });
  },
}));
