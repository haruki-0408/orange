import { create } from 'zustand';
import { ProgressbarType } from '../types/types';

interface ProgressStore {
  progressBar: ProgressbarType;
  updateProgress: (percentage: number, status: ProgressbarType['status']) => void;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressStore>((set) => ({
  progressBar: {
    percentage: 0,
    status: 'PROCESSING'
  },
  updateProgress: (percentage, status) => set({
    progressBar: { percentage, status }
  }),
  resetProgress: () => set({
    progressBar: { percentage: 0, status: 'PROCESSING' }
  })
})); 