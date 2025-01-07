import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ConnectionStatus, ProgressData } from '../types/types';

interface SSEState {
  // 接続状態
  connectionStatus: ConnectionStatus;
  // アクティブなワークフローID
  activeWorkflowId: string | null;
  // EventSourceインスタンスを保持
  eventSource: EventSource | null;
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
  connectionStatus: null,
  activeWorkflowId: null,
  eventSource: null
};

export const useSSEStore = create<SSEState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      initializeSSE: (workflowId: string, onMessage: (data: ProgressData & { isFirstMessage?: boolean }) => void) => {
        const eventSource = new EventSource(`/api/sse/${workflowId}`);
        set({ 
          activeWorkflowId: workflowId,
          connectionStatus: 'CONNECTING',
          eventSource  // EventSourceインスタンスを保存
        });

        let isFirstMessage = true;

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as ProgressData;
            console.log('SSE Message received:', data);
            
            if (isFirstMessage) {
              isFirstMessage = false;
              set({ connectionStatus: 'LIVE' });
              onMessage({ ...data, isFirstMessage: true });
              return;
            }

            onMessage(data);

          } catch (error) {
            console.error("Error processing SSE message:", error);
            set({ connectionStatus: 'ERROR' });
            eventSource.close();
          }
        };

        eventSource.onerror = () => {
          set({ connectionStatus: 'ERROR' });
          eventSource.close();
        };

        return () => {
          eventSource.close();
          set({ 
            connectionStatus: null,
            eventSource: null 
          });
        };
      },

      terminateSSE: () => {
        // 既存のEventSourceがあれば接続を閉じる
        const currentEventSource = get().eventSource;
        if (currentEventSource) {
          console.log("SSE接続終了");
          currentEventSource.close();
          set({ 
            connectionStatus: null,
            eventSource: null 
          });
        }
        set(initialState);
      },

      setConnectionStatus: (status: ConnectionStatus) => {
        set({ connectionStatus: status });
      }
    }),
    { name: 'sse-store' }
  )
); 