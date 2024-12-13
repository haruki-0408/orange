"use client";
import { Room } from "@/features/room/components/Room";
import { CustomEdge } from "@/components/ui-mass/CustomEdge";
import { CustomNode } from "@/components/ui-mass/CustomNode";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Controls,
  Background,
  MiniMap,
  BezierEdge
} from "reactflow";
import "reactflow/dist/style.css";
import { MultiplayerLayer } from "@/components/layout/MultiplayerLayer";

const nodeTypes = {
  custom: CustomNode
};

const edgeTypes = {
  custom: CustomEdge
};

// ノードの初期データ
const initialNodes: Node[] = [
  {
    id: "1",
    type: "custom",
    position: { x: 100, y: 50 },
    data: {
      title: "User Authentication",
      description: "Lambda function for user authentication",
      icon: "λ",
      status: "progress",
      code: "exports.handler = async (event) => {\n  // Lambda authentication logic\n  return { statusCode: 200 };\n}",
      serviceType: "Lambda"
    }
  },
  {
    id: "2",
    type: "custom",
    position: { x: 400, y: 50 },
    data: {
      title: "Message Queue",
      description: "SQS queue for message processing",
      icon: "⇄",
      status: "pending",
      code: '{\n  "QueueName": "ProcessingQueue",\n  "DelaySeconds": 0,\n  "MessageRetentionPeriod": 345600\n}',
      serviceType: "SQS"
    }
  },
  {
    id: "3",
    type: "custom",
    position: { x: 100, y: 250 },
    data: {
      title: "REST API",
      description: "API Gateway endpoint for client requests",
      icon: "⚡",
      status: "success",
      code: '{\n  "path": "/api/v1",\n  "method": "POST",\n  "integration": "Lambda"\n}',
      serviceType: "APIGateway"
    }
  },
  {
    id: "4",
    type: "custom",
    position: { x: 400, y: 250 },
    data: {
      title: "User Database",
      description: "DynamoDB table for user data",
      icon: "📊",
      status: "failed",
      code: '{\n  "TableName": "Users",\n  "KeySchema": [\n    { "AttributeName": "userId", "KeyType": "HASH" }\n  ]\n}',
      serviceType: "DynamoDB"
    }
  },
  {
    id: "5",
    type: "custom",
    position: { x: 250, y: 450 },
    data: {
      title: "File Storage",
      description: "S3 bucket for file storage",
      icon: "���",
      status: "stopped",
      code: '{\n  "BucketName": "user-files",\n  "AccessControl": "Private",\n  "VersioningConfiguration": "Enabled"\n}',
      serviceType: "S3"
    }
  }
];

const initialEdges = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    type: "custom",
    sourceHandle: "bottom",
    targetHande: "top"
  },
  {
    id: "e1-3",
    source: "1",
    target: "3",
    type: "custom",
    sourceHandle: "bottom",
    targetHande: "top"
  },
  {
    id: "e2-4",
    source: "2",
    target: "4",
    type: "custom",
    sourceHandle: "bottom",
    targetHande: "top"
  },
  {
    id: "e3-4",
    source: "3",
    target: "4",
    type: "custom",
    sourceHandle: "bottom",
    targetHande: "top"
  },
  {
    id: "e4-5",
    source: "4",
    target: "5",
    type: "custom",
    sourceHandle: "bottom",
    targetHande: "top"
  }
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
    console.log("SSE接続開始:", `/api/sse/${workflowId}`);

    eventSource.onopen = () => {
      console.log("SSE接続成功");
    };

    eventSource.onmessage = (event) => {
      console.log("受信したメッセージ:", event);
      try {
        const data = JSON.parse(event.data);
        setProgress(data.progress);

        setNodes((prevNodes) =>
          prevNodes.map((node) => {
            if (node.id === "1") {
              return { ...node, data: { ...node.data, label: `Step 1: ${data.progress}` } };
            }
            return node;
          })
        );
      } catch (error) {
        console.error("メッセージパースエラー:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE接続エラー:", error);
      eventSource.close();
    };

    return () => {
      console.info("SSE接続終了");
      eventSource.close();
    };
  }, [workflowId]);

  const startWorkflow = () => {
    const randomWorkflowId = Math.random().toString(36).substring(2, 10);
    setWorkflowId(randomWorkflowId);
    console.log(`Started workflow with ID: ${randomWorkflowId}`);
  };

  return (
    // <div style={{ width: "100vw", height: "100vh", padding: "20px" }}>
    //   <h1>Workflow Progress Tracker</h1>
    //   <button onClick={startWorkflow}>Start Workflow</button>
    //   {workflowId && <p>Connecting to workflow .......</p>}
    //   {progress && <p>Progress: {progress}</p>}
    //   <div style={{ height: "calc(100vh - 200px)", width: "100%", marginTop: "20px" }}>
    //     <ReactFlow
    //       nodes={nodes}
    //       edges={edges}
    //       nodeTypes={nodeTypes}
    //       edgeTypes={edgeTypes}
    //       onNodesChange={onNodesChange}
    //       onEdgesChange={onEdgesChange}
    //       onConnect={onConnect}
    //     >
    //       <Controls />
    //       <MiniMap />
    //       <Background gap={20} size={1} style={{ backgroundColor: "#0000" }} />
    //     </ReactFlow>
    //   </div>
    // </div>
    <Room>
      <MultiplayerLayer/>
    </Room>
  );
}
