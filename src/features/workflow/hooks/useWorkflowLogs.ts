import useSWR, { useSWRConfig } from 'swr';
import { LogGroupResults, LogGroupRequestIds } from '../types/types';
import { startAndWaitLogQueries } from '@/app/actions/workflow';
import { useCallback } from 'react';

interface UseWorkflowLogsOptions {
  logGroupRequests: LogGroupRequestIds;
  timestamp: string;
}

interface LogStatus {
  current: number;
  expected: number;
}

export function useWorkflowLogs(
    workflowId: string | undefined,
    options: UseWorkflowLogsOptions
  ) {
    const { logGroupRequests, timestamp } = options;
    const expectedLogCount = Object.keys(logGroupRequests).length;
  
    const getLogStatus = (results: LogGroupResults): LogStatus => {
      const actualCount = Object.keys(results).length;
      const expectedCount = Object.keys(logGroupRequests).length;
      return {
        current: actualCount,
        expected: expectedCount
      };
    };
  
    const { data: logGroupResults, isLoading, mutate: refetch } = useSWR(
      workflowId && expectedLogCount > 0
        ? ['workflow-logs', workflowId]
        : null,
      async () => {
        if (!workflowId || expectedLogCount === 0) return null;
  
        const results = await startAndWaitLogQueries(
          workflowId,
          logGroupRequests,
          timestamp
        );
  
        const status = getLogStatus(results);
        const isComplete = status.current >= status.expected;
  
        return {
          results,
          isComplete,
          status
        };
      },
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false,
        dedupingInterval: 200,
      }
    );
  
    return {
      logGroupResults: logGroupResults?.results ?? null,
      isLoading,
      isComplete: logGroupResults?.isComplete ?? false,
      logStatus: logGroupResults?.status,
      refetchLogs: useCallback(async () => {
        if (!workflowId) return;
        await refetch();
      }, [workflowId, refetch])
    };
  }
  