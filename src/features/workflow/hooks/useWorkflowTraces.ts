import { useMemo } from 'react';
import useSWR from 'swr';
import { 
  WorkflowProgressItem,
  LogData,
  WorkflowTraceResult,
} from '../types/types';
import { traceService } from '../services/traceService';

export const useWorkflowTraces = (
  workflowProgress: WorkflowProgressItem[],
  traceIds: { mainTraceId: string; subTraceId: string },
  logData: LogData[]
): WorkflowTraceResult => {
  // トレースデータのフェッチ
  const { data: traces, error, isLoading: isLoadingTraces } = useSWR(
    // ログデータが空の場合はフェッチしない
    traceIds.mainTraceId && traceIds.subTraceId && logData.length > 0
      ? ['workflow-traces', traceIds.mainTraceId, traceIds.subTraceId]
      : null,
    () => traceService.fetchTraces(traceIds),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 5000,
      onError: (err) => {
        console.error('Failed to fetch traces:', err);
      }
    }
  );

  // データ処理をサービスに委譲
  const processedData = useMemo(
    () => traceService.processTraceData(workflowProgress, traces, traceIds, logData),
    [workflowProgress, traces, logData, traceIds]
  );

  return {
    ...processedData,
    isLoading: logData.length > 0 ? isLoadingTraces : false,
    error: error instanceof Error ? error : null
  };
}; 