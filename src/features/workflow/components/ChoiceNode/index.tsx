import React from 'react';
import { Handle, NodeProps, Position } from '@xyflow/react';
import styles from './style.module.scss';
import { Node } from '@xyflow/react';

export type ChoiceNode = Node<
  {
    condition: string;
  },
  "choice"
>;

export default function ChoiceNode(props: NodeProps<ChoiceNode>) {

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
            <div className={styles.condition}>{props.data.condition as string}</div>
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
}
