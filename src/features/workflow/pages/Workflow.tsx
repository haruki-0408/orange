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
  MiniMap
} from "reactflow";
import "reactflow/dist/style.css";
import { CustomEdge } from "../components/CustomEdge";
import { CustomNode } from "../components/CustomNode";
import { MainWorkflowGroup } from "../components/MainWorkflowGroup";
import { SubWorkflowGroup } from "../components/SubWorkflowGroup";
import { ChoiceNode } from "../components/ChoiceNode";
import { initialNodes } from "../const/initialNodes";
import { initialEdges } from "../const/initialEdges";
import dagre from "dagre";
import { FCX } from "@/types/types";

interface Props {
  className?: string;
  onWorkflowStart?: (workflowId: string) => void;
  onProgressUpdate?: (progress: string) => void;
}

const nodeTypes = {
  custom: CustomNode,
  mainGroup: MainWorkflowGroup,
  subGroup: SubWorkflowGroup,
  choice: ChoiceNode
};

const edgeTypes = {
  custom: CustomEdge
};

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    // 新しいdagreグラフを初期化
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
  
    // グラフの方向と間隔を設定
    const graphConfig = {
      rankdir: 'TB',    // 上から下へのレイアウト
      align: 'UL',      // 左上揃え
      nodesep: 80,      // ノード間の水平間隔
      ranksep: 120,     // ノード間の垂直間隔
      marginx: 50,      // 水平マージン
      marginy: 80       // 垂直マージン
    };
    dagreGraph.setGraph(graphConfig);
  
    // ノードタイプに基づいてサイズを定義
    const getNodeDimensions = (node: Node) => {
      switch (node.type) {
        case 'mainGroup':
          return { width: 1600, height: 800 };
        case 'subGroup':
          return { width: 1000, height: 600 };
        case 'choice':
          return { width: 120, height: 80 };
        default:
          return { width: 200, height: 100 };
      }
    };
  
    // グループノードを最初に追加
    nodes
      .filter(node => ['mainGroup', 'subGroup'].includes(node.type || ''))
      .forEach(node => {
        const dimensions = getNodeDimensions(node);
        dagreGraph.setNode(node.id, dimensions);
      });
  
    // 通常のノードを追加
    nodes
      .filter(node => !['mainGroup', 'subGroup'].includes(node.type || ''))
      .forEach(node => {
        const dimensions = getNodeDimensions(node);
        dagreGraph.setNode(node.id, dimensions);
      });
  
    // エッジを追加
    edges.forEach(edge => {
      dagreGraph.setEdge(edge.source, edge.target);
    });
  
    // レイアウトを計算
    dagre.layout(dagreGraph);
  
    // グループ内のノードの位置を調整する関数
    const adjustNodePositionInGroup = (node: Node, parentNode: Node | undefined) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      const parentPos = parentNode ? dagreGraph.node(parentNode.id) : null;
  
      if (!nodeWithPosition) return node;
  
      if (parentPos && node.parentNode) {
        // グループ内での相対位置を計算
        const padding = 50;
        const relativeX = nodeWithPosition.x - parentPos.x;
        const relativeY = nodeWithPosition.y - parentPos.y;
  
        // グループ内に収まるように位置を制限
        const maxX = parentPos.width - nodeWithPosition.width - padding;
        const maxY = parentPos.height - nodeWithPosition.height - padding;
  
        return {
          ...node,
          position: {
            x: Math.max(padding, Math.min(relativeX, maxX)),
            y: Math.max(padding, Math.min(relativeY, maxY))
          }
        };
      }
  
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWithPosition.width / 2,
          y: nodeWithPosition.y - nodeWithPosition.height / 2
        }
      };
    };
  
    // 新しい位置を適用
    const layoutedNodes = nodes.map(node => {
      if (node.parentNode) {
        const parentNode = nodes.find(n => n.id === node.parentNode);
        return adjustNodePositionInGroup(node, parentNode);
      }
      return adjustNodePositionInGroup(node, undefined);
    });
  
    return { nodes: layoutedNodes, edges };
  };

export const Workflow: FCX<Props> = ({ className, onWorkflowStart, onProgressUpdate }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // ノードのステータスが変更されたときにエッジのステータスも更新する
  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge) => {
        const targetNode = nodes.find((node) => node.id === edge.target);
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

  // 自動レイアウトを適用する関数
//   const onLayout = useCallback(() => {
//     const { nodes: layoutedNodes } = getLayoutedElements(nodes, edges);
//     setNodes([...layoutedNodes]);
//   }, [nodes, edges, setNodes]);

// 初回レンダリング時に自動レイアウトを適用
//   useEffect(() => {
//     const { nodes: layoutedNodes } = getLayoutedElements(nodes, edges);
//     setNodes([...layoutedNodes]);
//   }, []); // 依存配列を空にして初回のみ実行

  const handleStartWorkflow = () => {
    const randomWorkflowId = Math.random().toString(36).substring(2, 10);
    onWorkflowStart?.(randomWorkflowId);
  };

  return (
    <div className={`${className} w-full h-full`}>
      <div className="flex items-center gap-4 mb-4 p-4">
        <h1 className="text-xl font-bold">Workflow Progress Tracker</h1>
        <button
          onClick={handleStartWorkflow}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Start Workflow
        </button>
        {/* <button
          onClick={onLayout}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Reset Layout
        </button> */}
      </div>
      <div style={{ width: "50%", height: "calc(100vh - 100px)" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          minZoom={0.1}
          maxZoom={1.5}
          nodesDraggable={false}
          nodesConnectable={false}
          panOnDrag={true}
          zoomOnScroll={true}
          fitViewOptions={{
            padding: 0.2,
            includeHiddenNodes: true,
            maxZoom: 1
          }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
          style={{ background: "#1a1a1a" }}
        >
          <Controls showInteractive={false} className="text-white" />
          <MiniMap
            style={{
              backgroundColor: "#1a1a1a"
              //   maskColor: 'rgba(255, 255, 255, 0.2)',
            }}
            className="bg-[#1a1a1a]"
          />
          <Background gap={20} size={1} color="#333333" className="bg-[#1a1a1a]" />
        </ReactFlow>
      </div>
    </div>
  );
};
