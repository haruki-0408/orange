import React from 'react';
import { Handle, NodeProps, Position } from '@xyflow/react';
import styles from './style.module.scss';
import clsx from 'clsx';
import { Node } from '@xyflow/react';
export type TerminalNode = Node<
  {
    type: 'start' | 'end';
  },
  "terminal"
>;

export default function TerminalNode(props: NodeProps<TerminalNode>) {
  const isStart = props.data.type === 'start';

  return (
    <div className={clsx(styles.terminalNode, styles[props.data.type])}>
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
          id="source-bottom"
          type="source"
          position={Position.Bottom}
          className={styles.handle}
        />
      ) : (
        <Handle
          id="target-top"
          type="target"
          position={Position.Top}
          className={styles.handle}
        />
      )}
    </div>
  );
};
