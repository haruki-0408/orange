'use client'
import React, { memo } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import styles from './style.module.scss';
import { FCX } from '@/types/types';

export const ChoiceNode: FCX<NodeProps> = memo(({ data }) => {
  return (
    <div className={styles.choiceNodeWrapper}>
      <Handle
        id="target-top"
        type="target"
        position={Position.Top}
        className={styles.handle}
        isConnectable={false}
      />

      <div className={styles.choiceNode}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.title}>Condition</div>
            <div className={styles.condition}>{data.condition}</div>
          </div>
          <div className={styles.paths}>
            <div className={styles.path}>
              <div className={styles.pathLabel}>OK</div>
              <div className={styles.pathArrow}>↓</div>
            </div>
            <div className={styles.path}>
              <div className={styles.pathLabel}>NG</div>
              <div className={styles.pathArrow}>→</div>
            </div>
          </div>
        </div>
      </div>

      <Handle
        id="source-right"
        type="source"
        position={Position.Right}
        className={styles.handle}
        isConnectable={false}
      />

      <Handle 
        id="source-bottom"
        type="source"
        position={Position.Bottom}
        className={styles.handle}
        isConnectable={false}
      />
    </div>
  );
});

export default ChoiceNode; 