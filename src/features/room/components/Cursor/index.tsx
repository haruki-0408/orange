import React from "react";
import { FCX } from "@/types/types";
// import styles from "./style.module.scss";

interface Props {
  color: string;
  x: number;
  y: number;
}

export const Cursor:FCX<Props> = ({color, x, y}) => {
  return (
    <svg
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      zIndex: 9999,
      transform: `translateX(${x}px) translateY(${y}px)`,
    }}
    width="24"
    height="36"
    viewBox="0 0 24 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
      fill={color}
    />
  </svg>
  )
}