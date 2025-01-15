import React from 'react';
import { FCX } from '@/types/types';
import { TimelineTraceData } from '../../types/types';
import styles from './style.module.scss';
import clsx from 'clsx';

interface Props {
  timeline: TimelineTraceData;
  isActive?: boolean;
  onClick?: () => void;
}

export const TimelineCard: FCX<Props> = ({
  timeline,
  isActive,
  onClick,
  className
}) => {
  // サービスタイプの判定
  const getServiceType = (stateName: string) => {
    if (stateName === 'api-gateway') return 'API Gateway';
    if (stateName === 'callback-queue') return 'SQS';
    return 'Lambda Function';
  };

  return (
    <div 
      className={clsx(styles.timelineItem, isActive && styles.active, className)}
      onClick={onClick}
    >
      <div className={styles.status}>
        <div className={clsx(styles.statusIndicator, styles.success)} />
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.topRow}>
            <div className={styles.serviceType}>
              {getServiceType(timeline.state_name)}
            </div>
            <time className={styles.time}>
              {timeline.start_at}
            </time>
          </div>
          <div className={styles.service}>
            <div className={styles.serviceName}>{timeline.state_name}</div>
          </div>
        </div>
        <div className={styles.details}>
          {timeline.request_id && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Request ID</span>
              <code className={styles.detailValue}>{timeline.request_id}</code>
            </div>
          )}
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Duration</span>
            <code className={styles.detailValue}>{timeline.duration}ms</code>
          </div>
          {timeline.memory_used && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Memory Used</span>
              <code className={styles.detailValue}>{timeline.memory_used}MB</code>
            </div>
          )}
          {timeline.memory_size && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Memory Size</span>
              <code className={styles.detailValue}>{timeline.memory_size}MB</code>
            </div>
          )}
          {timeline.is_cold_start !== null && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Cold Start</span>
              <code className={styles.detailValue}>{timeline.is_cold_start ? 'Yes' : 'No'}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 