import { useMemo } from 'react';
import useSWR from 'swr';
import { 
  WorkflowProgressItem,
  LogData,
  WorkflowTraceResult,
  TraceIds,
} from '../types/types';
import { traceService } from '../services/traceService';

export const useWorkflowTraces = (
  workflowProgress: WorkflowProgressItem[],
  logData: LogData[]
): WorkflowTraceResult => {
  // トレースIDを取得
  const traceIds:TraceIds = traceService.getTraceIds(logData);

  // トレースデータのフェッチ
  const { data: traces, error, isLoading: isLoadingTraces } = useSWR(
    // ログデータが空の場合はフェッチしない
    traceIds.mainTraceId && logData.length > 0
      ? ['workflow-traces', traceIds.mainTraceId, traceIds.subTraceId]
      : null,
    () => traceService.fetchTraces(traceIds),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 2000,
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