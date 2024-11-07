import { FCX } from "@/types/types";
import React from "react";
import { Cursor } from "../ui-parts/Cursor";
import { NameLabel } from "../ui-parts/NameLabel";

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
      <NameLabel color={color} name={name} y={y} x={x} />
    </div>
  );
};
