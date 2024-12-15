import { FCX } from "@/types/types";
import React from 'react';
import { EdgeProps, getSmoothStepPath } from 'reactflow';
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
  style = {},
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

  const edgeStatus = data?.targetNodeStatus || 'ready';
  
  return (
    <>
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <marker
            id="edge-arrow"
            viewBox="0 0 12 12"
            refX="6"
            refY="6"
            markerWidth="8"
            markerHeight="8"
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
        markerEnd="url(#edge-arrow)"
      />
    </>
  );
};
