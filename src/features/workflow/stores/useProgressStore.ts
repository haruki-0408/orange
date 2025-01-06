import { create } from 'zustand';
import { ProgressbarType } from '../types/types';

interface ProgressStore {
  progressBar: ProgressbarType;
  updateProgress: (percentage: number, status: ProgressbarType['status']) => void;
  resetProgress: () => void;
  onProgressComplete?: (status: ProgressbarType['status']) => void;
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  progressBar: {
    percentage: 0,
    status: 'PROCESSING'
  },
  updateProgress: (percentage, status) => {
    set({ progressBar: { percentage, status } });
    
    // 完了時のコールバック実行
    if ((status === 'SUCCESS' && percentage === 100) || status === 'FAILED') {
      get().onProgressComplete?.(status);
    }
  },
  resetProgress: () => set({
    progressBar: { percentage: 0, status: 'PROCESSING' }
  }),
  onProgressComplete: (status) => {
    console.log('onProgressComplete', status);
  },
})); 