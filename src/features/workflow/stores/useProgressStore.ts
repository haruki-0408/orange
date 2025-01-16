import { create } from 'zustand';
import { ProgressbarType } from '../types/types';

interface ProgressStore {
  progressBar: ProgressbarType;
  updateProgress: (percentage: number, status: ProgressbarType['status']) => void;
  resetProgress: () => void;
  onProgressComplete: ((status: ProgressbarType['status']) => void) | undefined;
  setOnProgressComplete: (callback: ((status: ProgressbarType['status']) => void) | undefined) => void;
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  progressBar: {
    percentage: 0,
    status: 'PROCESSING'
  },
  updateProgress: (percentage, status) => {
    set({ progressBar: { percentage, status } });
    
    if ((status === 'SUCCESS') || status === 'FAILED') {
      get().onProgressComplete?.(status);
    }
  },
  resetProgress: () => set({
    progressBar: { percentage: 0, status: 'PROCESSING' }
  }),
  onProgressComplete: undefined,
  setOnProgressComplete: (callback) => set({ 
    onProgressComplete: callback 
  })
})); 