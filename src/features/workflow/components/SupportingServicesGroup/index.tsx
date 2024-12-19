import React from 'react';
import { FCX } from '@/types/types';
import styles from './style.module.scss';

interface Props {
  data: {
    label: string;
  };
}

export const SupportingServicesGroup: FCX<Props> = ({ data: { label } }) => {
  return (
    <div className={styles.supportingGroup}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <span className={styles.icon}>⚙️</span>
          <h3 className={styles.label}>{label}</h3>
        </div>
      </div>
    </div>
  );
}; 