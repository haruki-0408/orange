import React, { useState } from 'react';
import useSWR from 'swr';
import { FCX } from '@/types/types';
import styles from './style.module.scss';
import { useReactFlow } from '@xyflow/react';
import clsx from 'clsx';
import { TimelineCard } from '../TimelineCard';
import { LogCard } from '../LogCard';
import { getWorkflowProgress } from '@/app/actions/workflow';
import { TimelineTraceData } from '@/features/workflow/types/types';
import { useWorkflowStore } from '../../stores/useWorkflowStore';
import { useWorkflowLogs } from '../../hooks/useWorkflowLogs';
import { RefreshIcon } from '@/components/ui-parts/RefreshIcon';
import { useWorkflowTraces } from '../../hooks/useWorkflowTraces';
import { TracesDashboardTabLoading } from '../TracesDashboardTabLoading';
import { MetricsData } from '../MetricsData';
import { mockTimelineData } from '../../const/mockTimelineData';
import { mockMetricsData } from '../../const/mockMetricsData';
import { mockLogData } from '../../const/mockLogData';
import { usingServices } from '../../const/usingServicesMapping';
import { useWorkflowProgress } from '../../hooks/useWorkflowProgress';

import Image from 'next/image';

interface Props {
  // traces?: TraceData[];
  currentNodeId?: string;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

type TabType = 'logs' | 'timeline' | 'metrics';

// Fetcher関数は配列の形で引数を受け取る

export const TracesDashboard: FCX<Props> = ({ 
  // traces,
  currentNodeId,
  isOpen,
  onToggle,
  className,
}) => {
  const { selectedWorkflow } = useWorkflowStore();
  const reactFlowInstance = useReactFlow();
  const { getNode } = reactFlowInstance;
  const [activeTab, setActiveTab] = useState<TabType>('logs');

  // Step 1: ワークフローの進行状況を取得
  const { workflowProgressData } = useWorkflowProgress({
    // nodes: getNodes(),
    // edges: getEdges(),
    // getNode,
    // getEdge,
    selectedWorkflow,
    // updateProgress
  });

  // Step 2: ログデータの取得と処理（カスタムフック）
  const { 
    logs,
    isLoading: isLoadingLogs,
    isComplete: isLogsComplete, 
    refetchLogs, 
    logStatus 
  } = useWorkflowLogs(
    selectedWorkflow?.workflow_id,
    workflowProgressData,
    selectedWorkflow?.timestamp || ''
  );

  // Step 3: トレースデータを取得
  const { 
    timelines,
    metrics,
    executionTime,
    isLoading: isLoadingTraces,
    error: tracesError
  } = useWorkflowTraces(
    workflowProgressData || [],
    {
      mainTraceId: '1-677faf89-09a6b95269c6e56c4d1ab356', // メインワークフロー
      subTraceId: '1-677faf92-cb722f47d43ddf5b002a4b18'  // サブワークフロー
    },
    logs
  );

  const isLoading = !isLogsComplete || isLoadingTraces;

  // Stats セクションのレンダリング
  const renderStats = () => {
    return (
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>Total Duration</div>
          <div className={styles.statValue}>
            {isLoading ? '-' : executionTime}
          </div>
        </div>
      </div>
    );
  };

  // タブコンテンツのレンダリング
  const renderTabContent = () => {
    switch (activeTab) {
      case 'logs':
        return (
          <div className={styles.logsTab}>
            {isLoadingLogs ? (
              <TracesDashboardTabLoading 
                message="Loading logs..." 
                showSpinner={true}
              />
            ) : logs.length === 0 ? (
              <div className={styles.logsEmpty}>
                <span>Not found logs</span>
              </div>
            ) : (
              <div>
                <div className={clsx(styles.logsStatus, !isLogsComplete && styles.collecting)}>
                  <div className={styles.message}>
                    <span>{isLogsComplete ? 'Logs collected' : 'Collecting logs'}</span>
                    <span className={styles.counter}>
                      {logStatus?.current}/{logStatus?.expected}
                    </span>
                  </div>
                  {!isLogsComplete && (
                    <button
                      className={styles.refetchButton}
                      onClick={refetchLogs}
                      disabled={isLoadingLogs}
                    >
                      <RefreshIcon className={styles.icon} />
                      Refresh
                    </button>
                  )}
                </div>
                {logs.map((log) => (
                  <LogCard key={log.id} {...log} />
                ))}
              </div>
            )}
          </div>
        );

      case 'timeline':
        if (!isLogsComplete) {
          return (
            <TracesDashboardTabLoading 
              message="Timeline data cannot be displayed until log collection is complete" 
              showSpinner={false}
            />
          );
        }
        if (isLoadingTraces) {
          return (
            <TracesDashboardTabLoading 
              message="Loading timeline data..." 
              showSpinner={true}
            />
          );
        }
        return (
          <div className={styles.timelineTab}>
            {timelines.map((timeline: TimelineTraceData) => (
              <TimelineCard
                key={timeline.state_name}
                timeline={timeline}
                isActive={timeline.state_name === currentNodeId}
                onClick={() => handleTraceClick(timeline.state_name)}
              />
            ))}
          </div>
        );

      case 'metrics':
        if (!isLogsComplete) {
          return (
            <TracesDashboardTabLoading 
              message="Metrics data cannot be displayed until log collection is complete" 
              showSpinner={false}
            />
          );
        }
        if (isLoadingTraces) {
          return (
            <TracesDashboardTabLoading 
              message="Loading metrics data..." 
              showSpinner={true}
            />
          );
        }
        return (
          <div className={styles.metricsTab}>
            <MetricsData metrics={metrics} />
          </div>
        );
    }
  };

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
        />
      </div>
      <div className={styles.dashboard}>
        {selectedWorkflow && (
          <div className={styles.overview}>
            <div className={styles.workflowInfo}>
              <h2>Result Dashboard</h2>
              <div className={styles.workflowMeta}>
                <div className={styles.workflowId}>
                  <span>Workflow ID:</span>
                  <code>{selectedWorkflow.workflow_id}</code>
                </div>
                <div className={styles.servicesSummary}>
                  <span className={styles.label}>Services:</span>
                  <div className={styles.serviceIcons}>
                    {Object.keys(usingServices).map((service, index) => (
                      <div key={index} className={styles.serviceIcon} data-service={service}>
                        <Image
                          src={usingServices[service] || '/aws/lambda.svg'}
                          alt={service}
                          width={24}
                          height={24}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {renderStats()}

        <div className={styles.tabNav}>
          <button
            className={clsx(styles.tabButton, activeTab === 'logs' && styles.active)}
            onClick={() => setActiveTab('logs')}
          >
            Logs
          </button>
          <button
            className={clsx(styles.tabButton, activeTab === 'timeline' && styles.active)}
            onClick={() => setActiveTab('timeline')}
          >
            Timeline
          </button>
          <button
            className={clsx(styles.tabButton, activeTab === 'metrics' && styles.active)}
            onClick={() => setActiveTab('metrics')}
          >
            Metrics
          </button>
        </div>

        <div className={styles.tabContent}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}; 