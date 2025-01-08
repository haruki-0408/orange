import React, { useState, useEffect, useCallback } from 'react';
import { FCX } from '@/types/types';
import styles from './style.module.scss';
import { useReactFlow } from '@xyflow/react';
import { TraceData } from '@/features/workflow/types/types';
import clsx from 'clsx';
import { MetricCard } from '../MetricCard';
import { TimelineCard } from '../TimelineCard';
import { mockTraceData } from '../../const/mockTraceData';
import { mockLogData } from '../../const/mockLogData';
import { mockMetricsData } from '../../const/mockMetricsData';
import { LogCard } from '../LogCard';
import { startAndWaitLogQueries, getWorkflowProgress } from '@/app/actions/workflow';
import { useLoadingStore } from '../../stores/useLoadingStore';
import { LogData } from '@/features/workflow/types/types';
import { useWorkflowStore } from '../../stores/useWorkflowStore';
import { stateNameLogGroupNameMapping } from '../../const/stateNameLogGroupNameMapping';
import { LoadingSpinner } from '@/components/ui-parts/LoadingSpinner';

interface Props {
  traces?: TraceData[];
  currentNodeId?: string;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

type TabType = 'metrics' | 'timeline' | 'logs';

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
  // const { setTimeliLoading } = useLoadingStore();
  const [logs, setLogs] = useState<LogData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleWorkflowProgress = useCallback(async () => {    
    try {
      if (!selectedWorkflow) return;
      setIsLoading(true); // ローディング開始

      const workflowProgressData = await getWorkflowProgress(
        selectedWorkflow.workflow_id,
      );

      // ワークフローの進行状況から、各ステートのリクエストIDを取得
      const logGroupRequests: { [key: string]: string } = {};
      if (workflowProgressData.length > 0) {
        workflowProgressData.forEach(event => {
          // ステート名からログループ名を取得
          const logGroupName = stateNameLogGroupNameMapping[event.state_name as keyof typeof stateNameLogGroupNameMapping];
          if (logGroupName && event.request_id) {
            logGroupRequests[logGroupName] = event.request_id;
          }
        });
      }

      console.log('logGroupRequests', logGroupRequests);
      
      // ログデータを取得
      const logsData = await startAndWaitLogQueries(
        selectedWorkflow.workflow_id,
        logGroupRequests,
        selectedWorkflow.timestamp
      );

      console.log('logsData', logsData);

      // LogData[]形式に変換
      const formattedLogs: LogData[] = Object.entries(logsData).map(([logGroupName, entries]) => {
        // 最初のログエントリか�レベルを判定
        const level = entries[0]?.message.includes('ERROR') ? 'error' : 
                     entries[0]?.message.includes('WARN') ? 'warning' : 'info';

        // ステート名を逆引き
        const stateName = Object.entries(stateNameLogGroupNameMapping).find(
          ([_, value]) => value === logGroupName
        )?.[0] || 'Unknown State';

        // RequestIdを抽出
        const requestId = entries[0]?.message.match(/RequestId: ([a-f0-9-]+)/)?.[1] || '';

        return {
          id: requestId,
          level,
          timestamp: entries[0]?.timestamp || new Date().toISOString(),
          service: 'Lambda', // ログループ名からサービス名を抽出することも可能
          stateName,
          logGroupName,
          logEntries: entries.map(entry => ({
            timestamp: entry.timestamp,
            ingestionTime: entry.ingestionTime,
            message: entry.message
          }))
        };
      });

      setLogs(formattedLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
      
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false); // ローディング終了
    }
  }, [selectedWorkflow]);

  useEffect(() => {
    if (selectedWorkflow) {
      handleWorkflowProgress();
    }
  }, [selectedWorkflow]);

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
              ) : (
                logs.map((log) => (
                  <LogCard
                    key={log.id}
                    stateName={log.stateName}
                    logGroupName={log.logGroupName}
                    logEntries={log.logEntries}
                    level={log.level}
                    service={log.service}
                    id={log.id}
                    timestamp={log.timestamp}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 