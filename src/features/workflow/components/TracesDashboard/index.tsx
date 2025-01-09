import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { FCX } from '@/types/types';
import styles from './style.module.scss';
import { useReactFlow } from '@xyflow/react';
import { TraceData } from '@/features/workflow/types/types';
import clsx from 'clsx';
import { MetricCard } from '../MetricCard';
import { TimelineCard } from '../TimelineCard';
import { mockTraceData } from '../../const/mockTraceData';
import { mockMetricsData } from '../../const/mockMetricsData';
import { LogCard } from '../LogCard';
import { getWorkflowProgress, getXRayTraces } from '@/app/actions/workflow';
import { LogData, LogGroupResults } from '@/features/workflow/types/types';
import { useWorkflowStore } from '../../stores/useWorkflowStore';
import { stateNameLogGroupNameMapping } from '../../const/stateNameLogGroupNameMapping';
import { LoadingSpinner } from '@/components/ui-parts/LoadingSpinner';
import { useWorkflowLogs } from '../../hooks/useWorkflowLogs';
import { RefreshIcon } from '@/components/ui-parts/RefreshIcon';
import { Trace } from "@aws-sdk/client-xray";

interface Props {
  traces?: TraceData[];
  currentNodeId?: string;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

type TabType = 'metrics' | 'timeline' | 'logs';

// ステートの状態に基づいてログレベルを判定する関数
const determineLogLevel = (state: string): 'error' | 'warning' | 'info' => {
  if (state === 'Failed' || state === 'failed') return 'error';
  if (state === 'Success' || state === 'success') return 'info';
  return 'warning'; // その他の状態の場合
};

// Fetcher関数は配列の形で引数を受け取る
const workflowProgressFetcher = async ([_, workflowId]: [string, string]) => {
  return getWorkflowProgress(workflowId);
};

// ログデータの整形ロジックを分離
const formatLogData = (
  logGroupResults: LogGroupResults,
  stateStatuses: Record<string, string>
): LogData[] => {
  return Object.entries(logGroupResults)
    .map(([logGroupName, entries]) => {
      const stateName = Object.entries(stateNameLogGroupNameMapping).find(
        ([_, value]) => value === logGroupName
      )?.[0] || 'Unknown State';

      return {
        id: entries[0]?.message.match(/RequestId: ([a-f0-9-]+)/)?.[1] || '',
        level: determineLogLevel(stateStatuses[stateName] || ''),
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
};

// X-Rayトレース解析用のユーティリティ関数
interface TraceMetrics {
  executionTime: string;
  serviceCount: number;
  metrics: {
    averageLatency: number;
    p95Latency: number;
    averageMemory: number;
    maxMemory: number;
    lambdaInvocations: number;
    apiRequests: number;
    coldStarts: number;
  };
}

const analyzeXRayTrace = (traces: Trace[]): TraceMetrics => {
  const metrics: TraceMetrics = {
    executionTime: '0分0秒',
    serviceCount: 0,
    metrics: {
      averageLatency: 0,
      p95Latency: 0,
      averageMemory: 0,
      maxMemory: 0,
      lambdaInvocations: 0,
      apiRequests: 0,
      coldStarts: 0
    }
  };

  if (!traces.length) return metrics;

  // サービス一覧を収集
  const services = new Set<string>();
  const latencies: number[] = [];
  const memories: number[] = [];
  
  traces.forEach(trace => {
    // 実行時間の計算
    if (trace.Duration) {
      const seconds = Math.floor(trace.Duration);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      metrics.executionTime = `${minutes}分${remainingSeconds}秒`;
    }

    trace.Segments?.forEach(segment => {
      const doc = JSON.parse(segment.Document || '{}');
      
      // サービスの収集
      if (doc.origin) {
        services.add(doc.origin);
      }

      // Lambda関連の指標を収集
      if (doc.origin === 'AWS::Lambda') {
        metrics.metrics.lambdaInvocations++;
        
        // メモリ使用量
        const memoryUsed = doc.aws?.lambda?.memory_used;
        if (memoryUsed) {
          memories.push(memoryUsed);
          metrics.metrics.maxMemory = Math.max(metrics.metrics.maxMemory, memoryUsed);
        }

        // コールドスタート検出
        if (doc.aws?.lambda?.cold_start === true) {
          metrics.metrics.coldStarts++;
        }

        // レイテンシー
        if (doc.end_time && doc.start_time) {
          const latency = (new Date(doc.end_time).getTime() - new Date(doc.start_time).getTime());
          latencies.push(latency);
        }
      }

      // API Gateway リクエストのカウント
      if (doc.origin === 'AWS::ApiGateway::Stage') {
        metrics.metrics.apiRequests++;
      }
    });
  });

  // 集計結果の計算
  metrics.serviceCount = services.size;
  
  if (latencies.length > 0) {
    metrics.metrics.averageLatency = Math.round(
      latencies.reduce((a, b) => a + b, 0) / latencies.length
    );
    latencies.sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);
    metrics.metrics.p95Latency = Math.round(latencies[p95Index]);
  }

  if (memories.length > 0) {
    metrics.metrics.averageMemory = Math.round(
      memories.reduce((a, b) => a + b, 0) / memories.length
    );
  }

  return metrics;
};

export const TracesDashboard: FCX<Props> = ({ 
  traces = mockTraceData, 
  currentNodeId,
  isOpen,
  onToggle,
  className,
}) => {
  const { selectedWorkflow } = useWorkflowStore();
  const reactFlowInstance = useReactFlow();
  const { getNode } = reactFlowInstance;
  const [activeTab, setActiveTab] = useState<TabType>('logs');
  const [logs, setLogs] = useState<LogData[]>([]);
  const [xrayTraces, setXrayTraces] = useState<Trace[]>([]);
  const [traceMetrics, setTraceMetrics] = useState<TraceMetrics | null>(null);

  // Step 1: ワークフローの進行状況を取得
  const { data: progressData } = useSWR(
    selectedWorkflow?.workflow_id ? ['workflow-progress', selectedWorkflow.workflow_id] : null,
    workflowProgressFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  // Step 2: 進行状況からリクエストパラメータを生成
  const { logGroupRequests, stateStatuses } = useMemo(() => {
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
          acc.logGroupRequests[logGroupName] = event.request_id;
          acc.stateStatuses[event.state_name] = event.status;
        }
        return acc;
      },
      { logGroupRequests: {}, stateStatuses: {} }
    );
  }, [progressData]);

  // Step 3: ログデータを取得（カスタムフックを使用）
  const { logGroupResults, isLoading, isComplete, refetchLogs, logStatus } = useWorkflowLogs(
    selectedWorkflow?.workflow_id,
    {
      logGroupRequests,
      timestamp: selectedWorkflow?.timestamp || ''
    }
  );

  // Step 4: ログデータを整形
  const formattedLogs = useMemo(() => {
    if (!logGroupResults) return [];
    return formatLogData(logGroupResults, stateStatuses);
  }, [logGroupResults, stateStatuses]);

  // ログの更新
  useEffect(() => {
    setLogs(formattedLogs);
  }, [formattedLogs]);

  const handleTraceClick = (nodeId: string) => {
    const node = getNode(nodeId);
    if (node) {
      reactFlowInstance.fitView({
        nodes: [node],
        duration: 600,
        padding: 0.2,
        minZoom: 1.5,
        maxZoom: 1.5,
      });
    }
  };

  // X-Rayトレース情報を取得して解析
  useEffect(() => {
    const fetchXRayTraces = async () => {
      try {
        const sampleTraceIds = ['1-677faf89-09a6b95269c6e56c4d1ab356'];
        const traces = await getXRayTraces(sampleTraceIds);
        setXrayTraces(traces);
        
        // トレースの解析
        const metrics = analyzeXRayTrace(traces);
        setTraceMetrics(metrics);
        
        console.log('Trace Analysis:', {
          executionTime: metrics.executionTime,
          serviceCount: metrics.serviceCount,
          metrics: metrics.metrics
        });
      } catch (error) {
        console.error('Failed to fetch X-Ray traces:', error);
      }
    };

    if (selectedWorkflow?.workflow_id) {
      fetchXRayTraces();
    }
  }, [selectedWorkflow?.workflow_id]);

  return (
    <div className={clsx(styles.dashboardWrapper, className)}>
      <div className={styles.toggleButtonContainer}>
        <button 
          className={clsx(styles.toggleButton, !isOpen && styles.closed)}
          onClick={onToggle}
          aria-label={isOpen ? "Close dashboard" : "Open dashboard"}
        />
      </div>
      <div className={styles.dashboard}>
        {/* Overview Section */}
        {selectedWorkflow && (
        <div className={styles.overview}>
          <div className={styles.workflowInfo}>
            <h2>Workflow Execution</h2>
            <div className={styles.workflowId}>
                <span>ID:</span>
                <code>{selectedWorkflow.workflow_id}</code>
              </div>
            </div>
          </div>
        )}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{mockMetricsData.summary.totalDuration}ms</div>
            <div className={styles.statLabel}>Duration</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{mockMetricsData.summary.totalServices}</div>
            <div className={styles.statLabel}>Services</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>${mockMetricsData.summary.estimatedCost}</div>
            <div className={styles.statLabel}>Cost</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNav}>
          <button
            className={clsx(styles.tabButton, activeTab === 'metrics' && styles.active)}
            onClick={() => setActiveTab('metrics')}
          >
            <svg className={styles.tabIcon} viewBox="0 0 24 24">
              <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M7 12l4-4 4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
            Metrics
          </button>
          <button
            className={clsx(styles.tabButton, activeTab === 'timeline' && styles.active)}
            onClick={() => setActiveTab('timeline')}
          >
            <svg className={styles.tabIcon} viewBox="0 0 24 24">
              <path d="M12 4v16M4 8h16M4 16h16" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
            Timeline
          </button>
          <button
            className={clsx(styles.tabButton, activeTab === 'logs' && styles.active)}
            onClick={() => setActiveTab('logs')}
          >
            <svg className={styles.tabIcon} viewBox="0 0 24 24">
              <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
            Logs
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {activeTab === 'metrics' && (
            <div className={styles.metricsTab}>
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Performance</h3>
                <div className={styles.metricGrid}>
                  {mockMetricsData.performance.latency.map((metric) => (
                    <MetricCard
                      key={metric.id}
                      title={metric.name}
                      value={metric.value}
                      unit={metric.unit}
                      trend={metric.trend as 'up' | 'down' | 'stable'}
                      change={metric.change}
                    />
                  ))}
                  {mockMetricsData.performance.memory.map((metric) => (
                    <MetricCard
                      key={metric.id}
                      title={metric.name}
                      value={metric.value}
                      unit={metric.unit}
                      trend={metric.trend as 'up' | 'down' | 'stable'}
                    />
                  ))}
                </div>
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Resource Usage</h3>
                <div className={styles.metricGrid}>
                  <MetricCard
                    title="Lambda Invocations"
                    value={mockMetricsData.resources.lambda.invocations}
                    unit="calls"
                  />
                  <MetricCard
                    title="API Requests"
                    value={mockMetricsData.resources.apiGateway.requests}
                    unit="reqs"
                  />
                  <MetricCard
                    title="DynamoDB Read Usage"
                    value={Math.round((mockMetricsData.resources.dynamoDB.readCapacity.consumed / mockMetricsData.resources.dynamoDB.readCapacity.provisioned) * 100)}
                    unit="%"
                  />
                  <MetricCard
                    title="Cold Starts"
                    value={mockMetricsData.performance.coldStarts.total}
                    trend={mockMetricsData.performance.coldStarts.trend as 'up' | 'down' | 'stable'}
                    change={mockMetricsData.performance.coldStarts.change}
                  />
                </div>
              </section>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className={styles.timelineTab}>
              {mockTraceData.map((trace) => (
                <TimelineCard
                  key={trace.id}
                  trace={trace}
                  isActive={trace.id === currentNodeId}
                  onClick={() => handleTraceClick(trace.id)}
                />
              ))}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className={styles.logsTab}>
              {isLoading ? (
                <div className={styles.logsLoading}>
                  <LoadingSpinner size="medium" />
                  <span>Loading logs...</span>
                </div>
              ) : logs.length === 0 ? (
                <div className={styles.logsEmpty}>
                  <span>Not found logs</span>
                </div>
              ) : (
                <div>
                  <div className={clsx(styles.logsStatus, !isComplete && styles.collecting)}>
                    <div className={styles.message}>
                      <span>
                        {isComplete ? 'Logs collected' : 'Collecting logs'}
                      </span>
                      <span className={styles.counter}>
                        {logStatus?.current}/{logStatus?.expected}
                      </span>
                    </div>
                    {!isComplete && (
                      <button
                        className={styles.refetchButton}
                        onClick={refetchLogs}
                        disabled={isLoading}
                      >
                        <RefreshIcon className={styles.icon} />
                        Refresh
                      </button>
                    )}
                  </div>
                  {logs.map((log) => (
                    <LogCard
                      key={log.id}
                      {...log}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 