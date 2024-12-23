import { FCX } from "@/types/types";
import { StateType } from "@/features/workflow/types/types";
import React from 'react';
import { EdgeProps, getSmoothStepPath } from '@xyflow/react';
import styles from './style.module.scss';
import clsx from 'clsx';

export const CustomEdge: FCX<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 0,
  });

  const edgeStatus: StateType = (data as { targetNodeStatus?: StateType })?.targetNodeStatus || 'ready';
  
  const markerId = `edge-arrow-${id}`;

  return (
    <>
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <marker
            id={`edge-arrow-${id}`}
            viewBox="-2 -2 16 16"
            refX="6"
            refY="6"
            markerWidth="12"
            markerHeight="12"
            orient="auto"
          >
            <path
              d="M 0 0 L 12 6 L 0 12 z"
              className={clsx(styles.arrow, styles[edgeStatus])}
            />
          </marker>
        </defs>
      </svg>
      <path
        id={id}
        className={clsx(styles.customEdge, styles[edgeStatus])}
        d={edgePath}
        markerEnd={`url(#edge-arrow-${id})`}
      />
    </>
  );
};

export default CustomEdge;

