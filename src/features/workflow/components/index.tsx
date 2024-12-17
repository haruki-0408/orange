import React, { useState, useEffect, useCallback } from "react";
import ReactFlow, {
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  NodeTypes,
  EdgeTypes,
  Node
} from "reactflow";
import "reactflow/dist/style.css";
import { CustomEdge } from "../components/CustomEdge";
import { CustomNode } from "../components/CustomNode";
import { MainWorkflowGroup } from "../components/MainWorkflowGroup";
import { SubWorkflowGroup } from "../components/SubWorkflowGroup";
import { ChoiceNode } from "../components/ChoiceNode";
import { initialNodes } from "../const/initialNodes";
import { initialEdges } from "../const/initialEdges";
import { FCX } from "@/types/types";
import { TracesDashboard } from "../components/TracesDashboard";
import { mockTraceData } from "../const/mockTraceData";
import { Header } from '../components/Header';
import { Category } from "../types/types";
import { TerminalNode } from './TerminalNode';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import '../styles/theme.scss';
import { BackgroundVariant } from "reactflow";
interface Props {
  className?: string;
  categories: Category[];
  onWorkflowStart?: (workflowId: string) => void;
  onProgressUpdate?: (progress: string) => void;
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
  mainGroup: MainWorkflowGroup,
  subGroup: SubWorkflowGroup,
  choice: ChoiceNode,
  terminal: TerminalNode
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge
};

export const Workflow: FCX<Props> = ({ className, onWorkflowStart, onProgressUpdate, categories }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [thesisTitle, setThesisTitle] = useState('');
  const { theme, toggleTheme } = useTheme();
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
          categories={categories}
          progress={{
            percentage: 50,
            status: 'processing'
          }}
        />
        <ReactFlowProvider>
          <div className="w-full relative flex overflow-hidden">
            <div style={{ 
              width: isSidebarOpen ? "60%" : `calc(100% - ${TOGGLE_BUTTON_WIDTH}px)`,
              height: "calc(100vh - 100px)",
              transition: "width 0.3s ease",
              position: "relative",
              background: theme === 'dark' ? "linear-gradient(180deg, rgba(14, 14, 20, 0.85), rgba(22, 22, 32, 0.82))" : "linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.95))",
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
                className="react-flow-wrapper"
              >
                <Controls 
                  showInteractive={false} 
                  className="react-flow-controls"
                  color={theme === 'dark' ? "#06b6d4" : "#2563eb"}
                />
                <MiniMap
                  style={{
                    backgroundColor: theme === 'dark' ? "rgba(13, 13, 15, 0.98)" : "#ffffff",
                    border: theme === 'dark' ? "1px solid rgba(6, 182, 212, 0.15)" : "1px solid rgba(37, 99, 235, 0.1)", 
                    borderRadius: "8px",
                    boxShadow: theme === 'dark' ? "0 4px 20px rgba(0, 0, 0, 0.2)" : "0 4px 20px rgba(0, 0, 0, 0.05)"
                  }}
                  className="react-flow-minimap"
                  maskColor={theme === 'dark' ? "rgba(6, 182, 212, 0.08)" : "rgba(37, 99, 235, 0.05)"}
                  nodeColor={(n) => {
                    if (n.id === selectedNodeId) {
                      return theme === 'dark' ? "#06b6d4" : "#2563eb";
                    }
                    return theme === 'dark' ? "rgba(255, 255, 255, 0.1)" : "rgba(37, 99, 235, 0.1)";
                  }}
                />
                <Background 
                  gap={20} 
                  size={1} 
                  color={theme === 'dark' ? 'rgba(0, 0, 0, 0.2)' : '#2563eb0d'} 
                  className="react-flow-background"
                  variant={BackgroundVariant.Lines}
                />
              </ReactFlow>
            </div>
            <div style={{ 
              width: isSidebarOpen ? "40%" : `${TOGGLE_BUTTON_WIDTH}px`,
              height: "calc(100vh - 100px)",
              transition: "width 0.3s ease",
            }}>
              <TracesDashboard
                workflowId="wf-001"
                traces={mockTraceData}
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
