import React from 'react';
import { FCX } from '@/types/types';
import styles from './style.module.scss';
import clsx from 'clsx';

interface MetricsDataProps {
  metrics: {
    averageLatency: number;
    p95Latency: number;
    coldStarts: number;
    lambdaAverageMemory: number;
    maxMemory: number;
    lambdaInvocations: number;
    dynamoDB: {
      totalReadCount: number;
      totalWriteCount: number;
      totalReadTime: number;
      totalWriteTime: number;
      averageReadTime: number;
      averageWriteTime: number;
    };
    s3: {
      totalReadCount: number;
      totalWriteCount: number;
      totalReadTime: number;
      totalWriteTime: number;
      averageReadTime: number;
      averageWriteTime: number;
    };
  };
}

const MetricCard: React.FC<{
  title: string;
  value: number | string;
  unit?: string;
  subValue?: {
    label: string;
    value: number;
    unit?: string;
  };
}> = ({ title, value, unit, subValue }) => (
  <div className={styles.metricCard}>
    <div className={styles.metricHeader}>
      <span className={styles.metricTitle}>{title}</span>
    </div>
    <div className={styles.metricValue}>
      {value}
      {unit && <span className={styles.unit}>{unit}</span>}
    </div>
    {subValue && (
      <div className={styles.subValue}>
        <span className={styles.subLabel}>{subValue.label}</span>
        <span className={styles.subValueText}>
          {subValue.value}
          {subValue.unit && <span className={styles.unit}>{subValue.unit}</span>}
        </span>
      </div>
    )}
  </div>
);

export const MetricsData: FCX<MetricsDataProps> = ({ metrics, className }) => {
  return (
    <div className={clsx(styles.metricsData, className)}>
      <div className={clsx(styles.section, styles.lambda)}>
        <h3 className={styles.sectionTitle}>Lambda Performance</h3>
        <div className={styles.metricsGrid}>
          <MetricCard
            title="Avg Latency"
            value={metrics.averageLatency}
            unit="ms"
            subValue={{
              label: "P95 Latency",
              value: metrics.p95Latency,
              unit: "ms"
            }}
          />
          <MetricCard
            title="Avg Memory"
            value={metrics.lambdaAverageMemory}
            unit="MB"
            subValue={{
              label: "Max Memory",
              value: metrics.maxMemory,
              unit: "MB"
            }}
          />
          <MetricCard
            title="Total Invocations"
            value={metrics.lambdaInvocations}
            unit="calls"
          />
          <MetricCard
            title="Total Cold Starts"
            value={metrics.coldStarts}
            unit="instances"
          />
        </div>
      </div>

      <div className={clsx(styles.section, styles.dynamodb)}>
        <h3 className={styles.sectionTitle}>DynamoDB Operations</h3>
        <div className={styles.metricsGrid}>
          <MetricCard
            title="Total Read Ops"
            value={metrics.dynamoDB.totalReadCount}
            unit="ops"
            subValue={{
              label: "Total Time",
              value: metrics.dynamoDB.totalReadTime,
              unit: "ms"
            }}
          />
          <MetricCard
            title="Total Write Ops"
            value={metrics.dynamoDB.totalWriteCount}
            unit="ops"
            subValue={{
              label: "Total Time",
              value: metrics.dynamoDB.totalWriteTime,
              unit: "ms"
            }}
          />
          <MetricCard
            title="Avg Read Latency"
            value={metrics.dynamoDB.averageReadTime}
            unit="ms"
          />
          <MetricCard
            title="Avg Write Latency"
            value={metrics.dynamoDB.averageWriteTime}
            unit="ms"
          />
        </div>
      </div>

      <div className={clsx(styles.section, styles.s3)}>
        <h3 className={styles.sectionTitle}>S3 Operations</h3>
        <div className={styles.metricsGrid}>
          <MetricCard
            title="Total Read Ops"
            value={metrics.s3.totalReadCount}
            unit="ops"
            subValue={{
              label: "Total Time",
              value: metrics.s3.totalReadTime,
              unit: "ms"
            }}
          />
          <MetricCard
            title="Total Write Ops"
            value={metrics.s3.totalWriteCount}
            unit="ops"
            subValue={{
              label: "Total Time",
              value: metrics.s3.totalWriteTime,
              unit: "ms"
            }}
          />
          <MetricCard
            title="Avg Read Latency"
            value={metrics.s3.averageReadTime}
            unit="ms"
          />
          <MetricCard
            title="Avg Write Latency"
            value={metrics.s3.averageWriteTime}
            unit="ms"
          />
        </div>
      </div>
    </div>
  );
}; 