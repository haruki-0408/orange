import React from 'react';
import { Handle, Position } from 'reactflow';
import styles from './style.module.scss';
import clsx from 'clsx';

interface Props {
  data: {
    type: 'start' | 'end';
  };
}

export const TerminalNode: React.FC<Props> = ({ data }) => {
  const isStart = data.type === 'start';

  return (
    <div className={clsx(styles.terminalNode, styles[data.type])}>
      <div className={styles.content}>
        <div className={styles.info}>
          <span className={styles.label}>
            {isStart ? 'Start' : 'End'}
          </span>
          <span className={styles.description}>
            {isStart ? 'Workflow Entry Point' : 'Workflow Completion'}
          </span>
        </div>
        <div className={styles.status}>
          <div className={styles.statusDot} />
          <span className={styles.statusText}>
            {isStart ? 'Ready' : 'Complete'}
          </span>
        </div>
      </div>
      {isStart ? (
        <Handle
          type="source"
          position={Position.Bottom}
          className={styles.handle}
        />
      ) : (
        <Handle
          type="target"
          position={Position.Top}
          className={styles.handle}
        />
      )}
    </div>
  );
};

export default TerminalNode; 