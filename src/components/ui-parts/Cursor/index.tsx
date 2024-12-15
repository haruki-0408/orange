import { FCX } from "@/types/types";
import React from "react";
import styles from "./style.module.scss";

type Props = {
  color: string;
  x: number;
  y: number;
};

export const Cursor: FCX<Props> = ({ color, x, y }) => {
  return (
    <div 
      className={styles.cursor}
      style={{
        transform: `translate(${x}px, ${y}px)`,  // transformで位置を制御
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 3L21 21M3 21L21 3"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className={styles.nameLabel}>
        {name}
      </div>
    </div>
  );
};