// import { Room } from "@/features/room/components/Room";
// import MultiplayerLayer from "../components/layout/MultiplayerLayer";

// export default function Home() {
//   return (
//   <Room>
//     <MultiplayerLayer />
//   </Room>
//   );
// }
'use client';

import { CustomEdge } from '@/components/ui-mass/CustomEdge';
import { CustomNode } from '@/components/ui-mass/CustomNode';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, { Node, Edge, useNodesState, useEdgesState, addEdge, Connection, Controls, Background, MiniMap, BezierEdge } from 'reactflow';
import 'reactflow/dist/style.css';

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

// ノードの初期データ
const initialNodes: Node[] = [
  {
    id: '1', // ノードのID
    type: 'custom', // カスタムノードタイプ
    position: { x: 100, y: 100 },
    data: {
      title: 'Lambda Function',
      description: 'Fetch Data',
      icon: '🔄',
      status: 'progress',
      code: 'fetch("/api")',
    },
  },
  {
    id: '2', // ノードのID
    type: 'custom',
    position: { x: 300, y: 100 },
    data: {
      title: 'DynamoDB',
      description: 'Save Data',
      icon: '📦',
      status: 'success',
      code: 'dynamodb.put({...})',
    },
  },
];

// エッジの初期データ
const initialEdges: Edge[] = [
  {
    id: 'e1-2', // エッジのID
    source: '1', // エッジの始点ノードID
    target: '2', // エッジの終点ノードID
    type: 'default', // デフォルトタイプのエッジ
  },
];


export default function Page() {
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // SSE接続
  useEffect(() => {
    if (!workflowId) return;

    const eventSource = new EventSource(`/api/sse/${workflowId}`);
    console.log('SSE接続開始:', `/api/sse/${workflowId}`);

    eventSource.onopen = () => {
      console.log('SSE接続成功');
    };

    eventSource.onmessage = (event) => {
      console.log('受信したメッセージ:', event);
      try {
        const data = JSON.parse(event.data);
        setProgress(data.progress);

        setNodes((prevNodes) =>
          prevNodes.map((node) => {
            if (node.id === '1') {
              return { ...node, data: { ...node.data, label: `Step 1: ${data.progress}` } };
            }
            return node;
          })
        );
      } catch (error) {
        console.error('メッセージのパースエラー:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE接続エラー:', error);
      eventSource.close();
    };

    return () => {
      console.info('SSE接続終了');
      eventSource.close();
    };
  }, [workflowId]);

  const startWorkflow = () => {
    const randomWorkflowId = Math.random().toString(36).substring(2, 10);
    setWorkflowId(randomWorkflowId);
    console.log(`Started workflow with ID: ${randomWorkflowId}`);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Workflow Progress Tracker</h1>
      <button onClick={startWorkflow}>Start Workflow</button>
      {workflowId && <p>Connecting to workflow .......</p>}
      {progress && <p>Progress: {progress}</p>}
      <div style={{ height: '500px', width: '50%', marginTop: '20px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
        >
          <Controls />
          <MiniMap />
          <Background gap={20} size={1} style={{ backgroundColor: '#0000' }} />
        </ReactFlow>
      </div>
    </div>
  );
}
