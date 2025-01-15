import React from 'react';
import { FCX } from '@/types/types';
import styles from './style.module.scss';
import Image from 'next/image';

interface Props {
  data: {
    label: string;
  };
}

export const SubWorkflowGroup: FCX<Props> = ({ data: { label } }) => {
  return (
    <div className={styles.subWorkflow}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <Image
            src="/aws/stepfunctions.svg"
            alt="Step Functions"
            width={20}
            height={20}
          />
          <h3 className={styles.label}>{label}</h3>
        </div>
      </div>
    </div>
  );
}; 