import React from 'react';
import { FCX } from '@/types/types';
import styles from './style.module.scss';
import Image from 'next/image';

interface Props {
  data: {
    label: string;
  };
}

export const MainWorkflowGroup: FCX<Props> = ({ data: { label } }) => {
  return (
    <div className={styles.mainWorkflow}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <Image
            src="/aws/stepfunctions.svg"
            alt="Step Functions"
            width={24}
            height={24}
          />
          <h2 className={styles.label}>{label}</h2>
        </div>
      </div>
    </div>
  );
}; 