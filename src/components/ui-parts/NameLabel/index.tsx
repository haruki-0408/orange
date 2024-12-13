import React from "react";
import { FCX } from "@/types/types";
import styles from "./style.module.scss";

interface Props {
  name: string;
  color: string;
  x: number
  y: number
}

export const NameLabel: FCX<Props> = ({ name, color }) => {
  return (
    <div className={styles.label} style={{ backgroundColor: color }}>
      {name}
    </div>
  );
};

export default NameLabel;