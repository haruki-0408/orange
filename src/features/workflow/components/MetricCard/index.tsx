import React from 'react';
import { FCX } from '@/types/types';
import styles from './style.module.scss';
import clsx from 'clsx';

interface Props {
  title: string;
  value: number | string;
  unit?: string;
  subValue?: {
    label: string;
    value: number;
    unit?: string;
  };
}

export const MetricCard: FCX<Props> = ({ 
  title, 
  value, 
  unit, 
  subValue,
  className 
}) => (
  <div className={clsx(styles.metricCard, className)}>
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