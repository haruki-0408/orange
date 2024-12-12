import React from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';
import './style.module.scss';

export const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, markerEnd }: EdgeProps) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <>
      {/* SVGグラデーション定義 */}
      <svg>
        <defs>
          <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff0000" />
            <stop offset="25%" stopColor="#00ff00" />
            <stop offset="50%" stopColor="#0000ff" />
            <stop offset="75%" stopColor="#ff00ff" />
            <stop offset="100%" stopColor="#ff0000" />
          </linearGradient>
        </defs>
      </svg>
      {/* エッジパス */}
      <path
        id={id}
        className="custom-edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: `url(#gradient-${id})` }}
      />
    </>
  );
};

