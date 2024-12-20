import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ConnectionStatus, ProgressData } from '../types/types';

interface SSEState {
  // 接続状態
  connectionStatus: ConnectionStatus;
  // アクティブなワークフローID
  activeWorkflowId: string | null;
  // SSE接続の初期化
  initializeSSE: (
    workflowId: string,
    onMessage: (data: ProgressData & { isFirstMessage?: boolean }) => void
  ) => () => void;
  // SSE接続の終了
  terminateSSE: () => void;
  // 接続状態の更新
  setConnectionStatus: (status: ConnectionStatus) => void;
}

const initialState = {
  connectionStatus: 'disconnected' as ConnectionStatus,
  activeWorkflowId: null
};

export const useSSEStore = create<SSEState>()(
  devtools(
    (set) => ({
      ...initialState,

      initializeSSE: (workflowId: string, onMessage: (data: ProgressData & { isFirstMessage?: boolean }) => void) => {
        const eventSource = new EventSource(`/api/sse/${workflowId}`);
        set({ 
          activeWorkflowId: workflowId,
          connectionStatus: 'connecting'
        });

        let isFirstMessage = true;

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as ProgressData;

            if (isFirstMessage) {
              isFirstMessage = false;
              set({ connectionStatus: 'connected' });
              onMessage({ ...data, isFirstMessage: true });
              return;
            }

            onMessage(data);

          } catch (error) {
            console.error("Error processing SSE message:", error);
            set({ connectionStatus: 'error' });
            eventSource.close();
          }
        };

        eventSource.onerror = () => {
          set({ connectionStatus: 'error' });
          eventSource.close();
        };

        return () => {
          eventSource.close();
          set({ connectionStatus: 'disconnected' });
        };
      },

      terminateSSE: () => {
        set(initialState);
      },

      setConnectionStatus: (status: ConnectionStatus) => {
        set({ connectionStatus: status });
      }
    }),
    { name: 'sse-store' }
  )
); 