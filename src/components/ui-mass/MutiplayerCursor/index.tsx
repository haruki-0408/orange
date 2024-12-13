import { FCX } from "@/types/types";
import React from "react";
import { NameLabel } from "@/components/ui-parts/NameLabel";
import { Cursor } from "@/components/ui-parts/Cursor";
import styles from "./style.module.scss";

type Props = {
  id: string;
  color: string;
  name: string;
  x: number;
  y: number;
};

export const MultiplayerCursor: FCX<Props> = ({ id, color, name, x, y }) => {
console.log(id)
  return (
    <div key={id}>
      <Cursor color={color} x={x} y={y} />
      <NameLabel color={color} name={name} x={x} y={y} />
    </div>
  );
};
