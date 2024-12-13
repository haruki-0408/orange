"use client";
import { Room } from "@/features/room/components/Room";
import { CustomEdge } from "@/components/ui-mass/CustomEdge";
import { CustomNode } from "@/components/ui-mass/CustomNode";
import React, { useState, useEffect, useCallback } from "react";
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
      serviceType: "Lambda",
      details: {
        functionName: "auth-handler",
        memory: 256,
        timeout: 30,
        runtime: "Node.js 18"
      },
      code: "exports.handler = async (event) => {\n  // Lambda authentication logic\n  return { statusCode: 200 };\n}"
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
      status: "ready",
      serviceType: "SQS",
      details: {
        queueName: "processing-queue",
        messageRetention: 345600,
        visibilityTimeout: 30,
        delaySeconds: 0
      },
      code: '{\n  "QueueName": "ProcessingQueue",\n  "DelaySeconds": 0,\n  "MessageRetentionPeriod": 345600\n}'
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
      serviceType: "APIGateway",
      details: {
        endpoint: "/api/v1/users",
        method: "POST",
        stage: "prod",
        authType: "IAM"
      },
      code: '{\n  "path": "/api/v1",\n  "method": "POST",\n  "integration": "Lambda"\n}'
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
      serviceType: "DynamoDB",
      details: {
        tableName: "Users",
        primaryKey: "userId",
        readCapacity: 5,
        writeCapacity: 5,
        indexes: ["email-index", "status-index"]
      },
      code: '{\n  "TableName": "Users",\n  "KeySchema": [\n    { "AttributeName": "userId", "KeyType": "HASH" }\n  ]\n}'
    }
  },
  {
    id: "5",
    type: "custom",
    position: { x: 700, y: 150 },
    data: {
      title: "File Storage",
      description: "S3 bucket for user uploads",
      icon: "📦",
      status: "stopped",
      serviceType: "S3",
      details: {
        bucketName: "user-uploads",
        versioning: true,
        encryption: "AES-256",
        accessControl: "Private"
      },
      code: '{\n  "BucketName": "user-uploads",\n  "Versioning": "Enabled",\n  "Encryption": "AES-256"\n}'
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
    targetHandle: "top",
    data: {
      targetNodeStatus: "ready"
    }
  },
  {
    id: "e1-3",
    source: "1",
    target: "3",
    type: "custom",
    sourceHandle: "bottom",
    targetHandle: "top",
    data: {
      targetNodeStatus: "ready"
    }
  },
  {
    id: "e2-4",
    source: "2",
    target: "4",
    type: "custom",
    sourceHandle: "bottom",
    targetHandle: "top",
    data: {
      targetNodeStatus: "ready"
    }
  },
  {
    id: "e3-4",
    source: "3",
    target: "4",
    type: "custom",
    sourceHandle: "bottom",
    targetHandle: "top",
    data: {
      targetNodeStatus: "ready"
    }
  },
  {
    id: "e4-5",
    source: "4",
    target: "5",
    type: "custom",
    sourceHandle: "bottom",
    targetHandle: "top",
    data: {
      targetNodeStatus: "ready"
    }
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
        console.error("メッセージ���ースエラー:", error);
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

  // ノードのステータスが変更されたときにエッジのステータスも更新する
  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge) => {
        const targetNode = nodes.find(node => node.id === edge.target);
        if (targetNode) {
          return {
            ...edge,
            data: {
              ...edge.data,
              targetNodeStatus: targetNode.data.status
            }
          };
        }
        return edge;
      })
    );
  }, [nodes]);

  return (
    <Room>
      <div className="w-screen p-5">
      <MultiplayerLayer>
        <h1>Workflow Progress Tracker</h1>
        <button onClick={startWorkflow}>Start Workflow</button>
        {workflowId && <p>Connecting to workflow .......</p>}
        {progress && <p>Progress: {progress}</p>}
        <div className="h-[calc(100vh-200px)] w-full mt-5">
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
            <Background gap={20} size={1} className="bg-[#0000]" />
          </ReactFlow>
        </div>
      </MultiplayerLayer>
      </div>
    </Room>
  );
}
