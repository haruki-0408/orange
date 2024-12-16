import React from 'react';
import { FCX } from '@/types/types';
import styles from './style.module.scss';
import clsx from 'clsx';

interface Props {
  title: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  change?: number;
}

export const MetricCard: FCX<Props> = ({ 
  title, 
  value, 
  unit, 
  trend, 
  change,
  className 
}) => (
  <div className={clsx(styles.metricCard, className)}>
    <div className={styles.metricHeader}>
      <span className={styles.metricTitle}>{title}</span>
      {trend && (
        <div className={clsx(styles.trendIndicator, styles[trend])}>
          <svg viewBox="0 0 24 24" className={styles.trendIcon}>
            {trend === 'up' && <path d="M7 14l5-5 5 5" stroke="currentColor" fill="none" strokeWidth="2"/>}
            {trend === 'down' && <path d="M7 10l5 5 5-5" stroke="currentColor" fill="none" strokeWidth="2"/>}
            {trend === 'stable' && <path d="M5 12h14" stroke="currentColor" fill="none" strokeWidth="2"/>}
          </svg>
          {change && <span>{change}%</span>}
        </div>
      )}
    </div>
    <div className={styles.metricValue}>
      {value}
      {unit && <span className={styles.unit}>{unit}</span>}
    </div>
  </div>
); 