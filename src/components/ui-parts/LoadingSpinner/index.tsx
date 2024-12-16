import React from 'react';
import { FCX } from '@/types/types';
import styles from './style.module.scss';
import clsx from 'clsx';

interface Props {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'white';
}

export const LoadingSpinner: FCX<Props> = ({ 
  className,
  size = 'medium',
  color = 'primary'
}) => {
  return (
    <div className={clsx(
      styles.spinner,
      styles[size],
      styles[color],
      className
    )}>
      <div className={styles.ring}>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 