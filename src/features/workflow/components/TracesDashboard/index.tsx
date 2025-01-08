import React, { useState, useEffect } from 'react';
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
import { startAndWaitLogQueries } from '@/app/actions/workflow';
import { useLoadingStore } from '../../stores/useLoadingStore';
import { LogData } from '@/features/workflow/types/types';
import { useWorkflowStore } from '../../stores/useWorkflowStore';

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
  const [activeTab, setActiveTab] = useState<TabType>('metrics');
  const { setLoading } = useLoadingStore();
  const [logs, setLogs] = useState<LogData[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!selectedWorkflow) return;

      try {
        setLoading(true);
        const logGroupRequests = {
          '/aws/lambda/melon_dev_request_generative_ai_model_api': 'c1b29677-26bc-4373-b9fc-d0d767fe22d3'
        };

        const logsData = await startAndWaitLogQueries(
          selectedWorkflow.workflow_id,
          logGroupRequests,
          selectedWorkflow.timestamp
        );
        
        // setLogs(logsData);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [selectedWorkflow, activeTab]);

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
              {/* {Object.entries(logs).map(([logGroupName, logEntries]) => (
                <LogCard
                  key={logGroupName}
                  stateName={logGroupName}
                  logGroupResults={logEntries}
                  level={log.level}
                  service={log.service}
                  id={log.id}
                  timestamp={log.timestamp}
                />
              ))} */}
              {mockLogData.map((log) => (
                <LogCard
                  key={log.id}
                  stateName={log.stateName}
                  logGroupResults={log.logGroupResults}
                  level={log.level}
                  service={log.service}
                  id={log.id}
                  timestamp={log.timestamp}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 