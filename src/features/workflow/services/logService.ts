import { 
  LogGroupResults, 
  LogData, 
  LogStatus,
  LogGroupRequests,
  WorkflowProgressItem
} from '../types/types';
import { startAndWaitLogQueries } from '@/app/actions/workflow';
import { stateNameLogGroupNameMapping } from '../const/stateNameLogGroupNameMapping';

export const logService = {
  /**
   * ログのステータスを取得
   */
  getLogStatus(results: LogGroupResults, expectedCount: number): LogStatus {
    return {
      current: Object.entries(results).length,
      expected: expectedCount
    };
  },

  /**
   * ステートの状態に基づいてログレベルを判定
   */
  determineLogLevel(state: string): 'error' | 'warning' | 'info' {
    if (state === 'Failed' || state === 'failed') return 'error';
    if (state === 'Success' || state === 'success') return 'info';
    return 'warning';
  },

  /**
   * ログデータを整形
   */
  formatLogData(
    logGroupRequests: LogGroupRequests,
    logGroupResults: LogGroupResults,
    stateStatuses: Record<string, string>
  ): LogData[] {
    return Object.entries(logGroupResults)
      .map(([requestId, entries]) => {
        const logGroupName = logGroupRequests[requestId] || '';
        const stateName = Object.entries(stateNameLogGroupNameMapping).find(
          ([, value]) => value === logGroupName
        )?.[0] || 'Unknown State';

        return {
          id: requestId,
          level: this.determineLogLevel(stateStatuses[stateName] || ''),
          timestamp: entries[0]?.timestamp || new Date().toISOString(),
          service: 'Lambda',
          stateName,
          logGroupName,
          logEntries: entries.map(entry => ({
            timestamp: entry.timestamp,
            ingestionTime: entry.ingestionTime,
            message: entry.message
          }))
        };
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  /**
   * 進行状況からログリクエストパラメータを生成
   */
  processLogRequests(progressData: WorkflowProgressItem[] | undefined) {
    if (!progressData?.length) {
      return { logGroupRequests: {}, stateStatuses: {} };
    }

    return progressData.reduce<{
      logGroupRequests: Record<string, string>;
      stateStatuses: Record<string, string>;
    }>(
      (acc, event) => {
        const logGroupName = stateNameLogGroupNameMapping[event.state_name as keyof typeof stateNameLogGroupNameMapping];
        if (logGroupName && event.request_id) {
          acc.logGroupRequests[event.request_id] = logGroupName;
          acc.stateStatuses[event.state_name] = event.status;
        }
        return acc;
      },
      { logGroupRequests: {}, stateStatuses: {} }
    );
  },

  /**
   * ログクエリの実行と結果の取得
   */
  async fetchLogs(
    logGroupRequests: LogGroupRequests,
    timestamp: string
  ) {
    const results = await startAndWaitLogQueries(
      logGroupRequests,
      timestamp
    );

    const status = this.getLogStatus(results, Object.keys(logGroupRequests).length);
    const isComplete = status.current >= status.expected;

    return {
      results,
      isComplete,
      status
    };
  }
}; 