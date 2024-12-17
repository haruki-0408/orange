import React from 'react';
import { FCX } from '@/types/types';
import styles from './style.module.scss';
import clsx from 'clsx';

interface Props {
  id: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  service: string;
  details: string;
}

export const ErrorCard: FCX<Props> = ({
  level,
  message,
  timestamp,
  service,
  details,
  className
}) => (
  <div className={clsx(styles.errorItem, styles[level], className)}>
    <div className={styles.errorHeader}>
      <div className={styles.errorInfo}>
        <span className={clsx(styles.errorLevel, styles[level])}>
          {level}
        </span>
        <time>{new Date(timestamp).toLocaleTimeString()}</time>
      </div>
      <span className={styles.errorService}>{service}</span>
    </div>
    <p className={styles.errorMessage}>{message}</p>
    <pre className={styles.errorDetails}>
      <code>{details}</code>
    </pre>
  </div>
); 