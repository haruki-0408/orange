import React from 'react';
import { FCX } from '@/types/types';
import { TraceData } from '../../types/types';
import styles from './style.module.scss';
import clsx from 'clsx';

interface Props {
  trace: TraceData;
  isActive?: boolean;
  onClick?: () => void;
}

export const TimelineCard: FCX<Props> = ({
  trace,
  isActive,
  onClick,
  className
}) => (
  <div 
    className={clsx(styles.timelineItem, isActive && styles.active, className)}
    onClick={onClick}
  >
    <div className={styles.status}>
      <div className={clsx(styles.statusIndicator, styles[trace.status])} />
    </div>
    <div className={styles.content}>
      <div className={styles.header}>
        <div className={styles.service}>
          <div className={styles.serviceName}>{trace.name}</div>
          <div className={styles.serviceType}>
            {trace.serviceType}
          </div>
        </div>
        <div className={styles.metrics}>
          <div className={styles.duration}>
            <span className={styles.durationValue}>{trace.duration}</span>
            <span className={styles.durationUnit}>ms</span>
          </div>
          <time className={styles.time}>
            {new Date(trace.startTime).toLocaleTimeString()}
          </time>
        </div>
      </div>
      <div className={styles.details}>
        {trace.details && Object.entries(trace.details).map(([key, value]) => (
          value && (
            <div key={key} className={clsx(styles.detailItem, styles[key])}>
              <span className={styles.detailLabel}>
                {key === 'requestId' ? 'ID' :
                 key === 'resourceName' ? 'Resource' :
                 key === 'memoryUsed' ? 'Memory' :
                 key === 'coldStart' ? 'Cold Start' :
                 key === 'errorMessage' ? 'Error' : key}
              </span>
              <code className={styles.detailValue}>
                {key === 'memoryUsed' ? `${value}MB` :
                 key === 'coldStart' ? (value ? 'Yes' : 'No') :
                 String(value)}
              </code>
            </div>
          )
        ))}
      </div>
    </div>
  </div>
); 