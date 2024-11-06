import {create} from 'zustand';

type MultiPlayerCursorState = {
  isConnected: boolean;
  cursorPosition: { x: number; y: number };
  updateCursor: (x: number, y: number) => void;
  setConnectionStatus: (status: boolean) => void;
};

export const useMultiPlayerCursorStore = create<MultiPlayerCursorState>((set) => ({
  isConnected: false,
  cursorPosition: { x: 0, y: 0 },
  setConnectionStatus: (status) => set({ isConnected: status }),
  updateCursor: (x, y) => set({ cursorPosition: { x, y } }),
}));
