import React from "react";
import { FCX } from "@/types/types";
// import styles from "./style.module.scss";

interface Props {
  name: string;
  color: string;
  x: number
  y: number
}

export const NameLabel: FCX<Props> = ({ x, y, name, color }) => {
  return (
    <div
        style={{
          position: 'absolute',
          top: y + 25,
          left: x,
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: color,
          padding: '5px 10px',
          borderRadius: '10px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        {name}
      </div>
  );
};

export default NameLabel;