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
  ReactFlowProvider
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
import { TracesDashboard } from "../components/TracesDashboard";
import { mockTraces } from "../const/mockTraceData";
import { Header } from '../components/Header';

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
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const graphConfig = {
    rankdir: "TB",
    align: "UL",
    nodesep: 80,
    ranksep: 120,
    marginx: 50,
    marginy: 80
  };
  dagreGraph.setGraph(graphConfig);

  const getNodeDimensions = (node: Node) => {
    switch (node.type) {
      case "mainGroup":
        return { width: 1600, height: 800 };
      case "subGroup":
        return { width: 1000, height: 600 };
      case "choice":
        return { width: 120, height: 80 };
      default:
        return { width: 200, height: 100 };
    }
  };

  nodes
    .filter((node) => ["mainGroup", "subGroup"].includes(node.type || ""))
    .forEach((node) => {
      const dimensions = getNodeDimensions(node);
      dagreGraph.setNode(node.id, dimensions);
    });

  nodes
    .filter((node) => !["mainGroup", "subGroup"].includes(node.type || ""))
    .forEach((node) => {
      const dimensions = getNodeDimensions(node);
      dagreGraph.setNode(node.id, dimensions);
    });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const adjustNodePositionInGroup = (node: Node, parentNode: Node | undefined) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const parentPos = parentNode ? dagreGraph.node(parentNode.id) : null;

    if (!nodeWithPosition) return node;

    if (parentPos && node.parentNode) {
      const padding = 50;
      const relativeX = nodeWithPosition.x - parentPos.x;
      const relativeY = nodeWithPosition.y - parentPos.y;

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

  const layoutedNodes = nodes.map((node) => {
    if (node.parentNode) {
      const parentNode = nodes.find((n) => n.id === node.parentNode);
      return adjustNodePositionInGroup(node, parentNode);
    }
    return adjustNodePositionInGroup(node, undefined);
  });

  return { nodes: layoutedNodes, edges };
};

export const Workflow: FCX<Props> = ({ className, onWorkflowStart, onProgressUpdate }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [thesisTitle, setThesisTitle] = useState('');

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

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

  const handleStartWorkflow = () => {
    if (!thesisTitle.trim()) {
      alert('論文タイトルを入力してください');
      return;
    }
    const randomWorkflowId = Math.random().toString(36).substring(2, 10);
    onWorkflowStart?.(randomWorkflowId);
  };

  // ボタンの幅を定数として定義
  const TOGGLE_BUTTON_WIDTH = 24;  // px

  return (
    <div className={`${className} w-full h-full`}>
      <Header 
        title={thesisTitle}
        onStart={handleStartWorkflow}
        onTitleChange={setThesisTitle}
      />
      <ReactFlowProvider>
        <div className="w-full relative flex">
          <div style={{ 
            width: isSidebarOpen ? "60%" : `calc(100% - ${TOGGLE_BUTTON_WIDTH}px)`,
            height: "calc(100vh - 100px)",
            transition: "width 0.3s ease",
            position: "relative",
            background: "linear-gradient(180deg, rgba(13, 13, 15, 0.98), rgba(17, 17, 21, 0.95))",
          }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
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
              style={{
                background: "transparent",
                backgroundImage: `
                  radial-gradient(circle at 50% 0%, rgba(6, 182, 212, 0.03) 0%, transparent 50%),
                  radial-gradient(circle at 0% 50%, rgba(6, 182, 212, 0.03) 0%, transparent 50%),
                  radial-gradient(circle at 100% 50%, rgba(6, 182, 212, 0.03) 0%, transparent 50%)
                `,
              }}
              className="react-flow-wrapper"
            >
              <Controls 
                showInteractive={false} 
                className="react-flow-controls"
              />
              <MiniMap
                style={{
                  backgroundColor: "rgba(13, 13, 15, 0.8)",
                  border: "1px solid rgba(6, 182, 212, 0.2)",
                  borderRadius: "8px",
                }}
                className="react-flow-minimap"
                maskColor="rgba(6, 182, 212, 0.1)"
                nodeColor={(n) => {
                  if (n.id === selectedNodeId) return "#06b6d4";
                  return "rgba(255, 255, 255, 0.3)";
                }}
              />
              <Background 
                gap={20} 
                size={1} 
                color="rgba(6, 182, 212, 0.1)" 
                className="react-flow-background"
              />
            </ReactFlow>
          </div>
          <div style={{ 
            width: isSidebarOpen ? "40%" : `${TOGGLE_BUTTON_WIDTH}px`,
            height: "calc(100vh - 100px)",
            transition: "width 0.3s ease",
            // overflow: "hidden"
          }}>
            <TracesDashboard
              workflowId="wf-001"
              traces={mockTraces}
              currentNodeId={selectedNodeId || undefined}
              isOpen={isSidebarOpen}
              onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          </div>
        </div>
      </ReactFlowProvider>
    </div>
  );
};
