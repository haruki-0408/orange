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

import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { Node, Edge, useNodesState, useEdgesState, addEdge, Connection, Controls, Background, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Step 1' } },
  { id: '2', position: { x: 200, y: 100 }, data: { label: 'Step 2' } },
];
const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

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
      <div style={{ height: '500px', width: '100%', marginTop: '20px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
        >
          <Controls />
          <MiniMap />
          <Background gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}
