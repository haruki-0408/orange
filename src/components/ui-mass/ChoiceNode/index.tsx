import React from 'react';
import { FCX } from '@/types/types';
import { Handle, Position } from 'reactflow';
import styles from './style.module.scss';
import clsx from 'clsx';

interface Props {
  data: {
    condition: string;
  };
}

export const ChoiceNode: FCX<Props> = ({ data }) => {
  return (
    <div className={styles.choiceNode}>
      <Handle type="target" position={Position.Top} />
      <div className={styles.diamond}>
        <span className={styles.condition}>{data.condition}</span>
      </div>
      <Handle type="source" position={Position.Bottom} id="success" />
      <Handle type="source" position={Position.Right} id="failure" />
    </div>
  );
};
