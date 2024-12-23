import { FCX } from "@/types/types";
import React from "react";
import { NameLabel } from "@/features/room/components/NameLabel";
import { Cursor } from "@/features/room/components/Cursor";
import styles from "./style.module.scss";

type Props = {
  id: string;
  color: string;
  name: string;
  x: number;
  y: number;
};

export const MultiplayerCursor: FCX<Props> = ({ id, color, name, x, y }) => {
  return (
    <div key={id}>
      <Cursor color={color} x={x} y={y} />
      <NameLabel color={color} name={name} x={x} y={y} />
    </div>
  );
};
