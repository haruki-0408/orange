import { Edge } from 'reactflow';

export const initialEdges: Edge[] = [
  // メインフロー
  {
    id: "e-start-api",
    source: "start",
    target: "api-gateway",
    type: "custom",
    data: { targetNodeStatus: "success" }
  },
  // ... 残りのエッジ定義
];