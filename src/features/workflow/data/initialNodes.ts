import { Node } from 'reactflow';

export const initialNodes: Node[] = [
  // Start Node
  {
    id: "start",
    type: "custom",
    position: { x: 100, y: 0 },
    data: {
      title: "Start",
      description: "Workflow Start",
      icon: "/aws/stepfunctions.svg",
      status: "success",
      serviceType: "Start",
    }
  },
  // ... 残りのノード定義
];
