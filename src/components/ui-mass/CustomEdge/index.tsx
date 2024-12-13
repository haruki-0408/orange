import { FCX } from "@/types/types";
import React from "react";
import { EdgeProps, getSmoothStepPath } from "reactflow";
import styles from "./style.module.scss";

export const CustomEdge: FCX<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <svg style={{ position: 'absolute', top: 0, left: 0 }}>
        <defs>
          <marker
            id="edge-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path
              className={styles['edge-arrow']}
              d="M 0 0 L 10 5 L 0 10 z"
            />
          </marker>
        </defs>
      </svg>
      <div className={styles['custom-edge-wrapper']}>
        <path
          id={id}
          className={styles['custom-edge-path']}
          d={edgePath}
          markerEnd="url(#edge-arrow)"
        />
        <button
          className={styles['edge-button']}
          style={{
            left: labelX,
            top: labelY,
          }}
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          →
        </button>
      </div>
    </>
  );
};

export default CustomEdge;

