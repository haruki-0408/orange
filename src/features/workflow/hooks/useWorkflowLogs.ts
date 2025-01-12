import useSWR from 'swr';
import { useCallback, useMemo } from 'react';
import { 
  WorkflowProgressItem 
} from '../types/types';
import { logService } from '../services/logService';

export function useWorkflowLogs(
  workflowId: string | undefined,
  progressData: WorkflowProgressItem[] | undefined,
  timestamp: string
) {
  // 進行状況からログリクエストパラメータを生成
  const { logGroupRequests, stateStatuses } = useMemo(
    () => logService.processLogRequests(progressData),
    [progressData]
  );

  const expectedLogCount = Object.keys(logGroupRequests).length;
  
  // ログデータのフェッチ
  const { data: logGroupResults, isValidating, mutate: refetch } = useSWR(
    workflowId && expectedLogCount > 0
      ? ['workflow-logs', workflowId]
      : null,
    () => logService.fetchLogs(logGroupRequests, timestamp),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 2000,
    }
  );

  // ログデータの整形
  const formattedLogs = useMemo(
    () => logGroupResults?.results 
      ? logService.formatLogData(logGroupRequests, logGroupResults.results, stateStatuses)
      : [],
    [logGroupRequests, logGroupResults?.results, stateStatuses]
  );

  const refetchLogs = useCallback(async () => {
    if (!workflowId) return;
    await refetch();
  }, [workflowId, refetch]);

  return {
    logs: formattedLogs,
    logGroupRequests,
    isValidating: isValidating,
    isComplete: logGroupResults?.isComplete ?? false,
    logStatus: logGroupResults?.status,
    refetchLogs
  };
}
  