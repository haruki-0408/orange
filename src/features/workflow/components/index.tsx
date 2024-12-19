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
  BackgroundVariant
} from "reactflow";
import "reactflow/dist/style.css";
import { CustomEdge } from "./CustomEdge";
import { CustomNode } from "./CustomNode";
import { MainWorkflowGroup } from "./MainWorkflowGroup";
import { SubWorkflowGroup } from "./SubWorkflowGroup";
import { ChoiceNode } from "./ChoiceNode";
import { initialNodes } from "../const/initialNodes";
import { initialEdges } from "../const/initialEdges";
import { FCX } from "@/types/types";
import { TracesDashboard } from "./TracesDashboard";
import { mockTraceData } from "../const/mockTraceData";
import { Header } from './Header';
import { TerminalNode } from './TerminalNode';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/theme.scss';
import { 
  Category, 
  WorkflowHistory, 
  ConnectionStatus, 
  ProgressbarType 
} from '../types/types';
import { WorkflowHistories } from './WorkflowHistories';
import { useWorkflowStore } from '../stores/useWorkflowStore';
import { useFlowStore } from '../stores/useFlowStore';
import { useWorkflowProgress } from '../hooks/useWorkflowProgress';
import { SupportingServicesGroup } from './SupportingServicesGroup';

interface Props {
  className?: string;
  categories: Category[];
  initialHistories: WorkflowHistory[];
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
  mainGroup: MainWorkflowGroup,
  subGroup: SubWorkflowGroup,
  choice: ChoiceNode,
  terminal: TerminalNode,
  supportingGroup: SupportingServicesGroup
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge
};

export const Workflow: FCX<Props> = ({ 
  className, 
  categories, 
  initialHistories 
}) => {
  const { theme } = useTheme();
  const { 
    addWorkflow, 
    getWorkflowBySession, 
    generateSessionId 
  } = useWorkflowStore();
  
  const [sessionId] = useState(() => generateSessionId());
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [thesisTitle, setThesisTitle] = useState('');
  const [histories, setHistories] = useState<WorkflowHistory[]>(initialHistories);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [progressBar, setProgressBar] = useState<ProgressbarType>({
    percentage: 0,
    status: 'processing'
  });

  // ReactFlow states
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // 進行中のワークフローの復元
  useEffect(() => {
    const activeWorkflow = getWorkflowBySession(sessionId);
    console.log('activeWorkflow', activeWorkflow);
    if (activeWorkflow) {
      setWorkflowId(activeWorkflow.workflowId);
      setThesisTitle(activeWorkflow.title);
      setSelectedCategory(activeWorkflow.category);
      setConnectionStatus('connecting');

      setHistories(prev => {
        const filteredHistories = prev.filter(
          history => history.workflow_id !== activeWorkflow.workflowId
        );
        return [{
          workflow_id: activeWorkflow.workflowId,
          title: activeWorkflow.title,
          category: activeWorkflow.category,
          status: 'processing',
          timestamp: activeWorkflow.timestamp
        }, ...filteredHistories];
      });
    }
  }, [sessionId, getWorkflowBySession]);

  // TracesDashboardの表示制御
  const shouldShowTraces = connectionStatus === 'completed' || connectionStatus === 'error';
  const [isTracesVisible, setIsTracesVisible] = useState(false);

  useEffect(() => {
    if (shouldShowTraces) {
      setTimeout(() => {
        setIsTracesVisible(true);
        setIsSidebarOpen(true);
      }, 500);
    } else {
      setIsTracesVisible(false);
      setIsSidebarOpen(false);
    }
  }, [shouldShowTraces]);

  // SSEによる進捗監視
  const { connectionStatus: sseConnectionStatus } = useWorkflowProgress(workflowId);

  useEffect(() => {
    setConnectionStatus(sseConnectionStatus);
  }, [sseConnectionStatus]);

  // ワークフロー生成開始
  const handleStartWorkflow = async () => {
    if (!thesisTitle.trim() || !selectedCategory) {
      alert('論文タイトルとカテゴリを選択してください');
      return;
    }

    const newWorkflowId = addWorkflow(thesisTitle, selectedCategory);
    if (!newWorkflowId) {
      alert('現在処理中のワークフローがあります。完了後に新しい生成を開始してください。');
      return;
    }

    setWorkflowId(newWorkflowId);
    setHistories(prev => [{
      workflow_id: newWorkflowId,
      title: thesisTitle,
      category: selectedCategory,
      status: 'processing',
      timestamp: new Date().toISOString()
    }, ...prev]);
  };

  // ReactFlowの状態をZustandから取得
  const { nodes: zustandNodes, edges: zustandEdges } = useFlowStore();

  return (
    <div className={`${className} w-full h-full`}>
      <Header 
        title={thesisTitle}
        onStart={handleStartWorkflow}
        onTitleChange={setThesisTitle}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        connectionStatus={connectionStatus}
        progressBar={progressBar}
        workflowId={workflowId}
      />
      <div className="flex w-full">
        <WorkflowHistories
          histories={histories}
          currentWorkflowId={workflowId}
          onSelect={(history) => {
            setWorkflowId(history.workflow_id);
          }}
          connectionStatus={connectionStatus}
        />
        <ReactFlowProvider>
          <div className="w-full relative flex overflow-hidden">
            <div 
              style={{ 
                width: isTracesVisible && isSidebarOpen ? "60%" : "100%",
                height: "calc(100vh - 100px)",
                transition: "width 0.5s ease",
                background: theme === 'dark' 
                  ? "linear-gradient(180deg, rgba(14, 14, 20, 0.85), rgba(22, 22, 32, 0.82))" 
                  : "linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.95))",
              }}
            >
              <ReactFlow
                nodes={zustandNodes}
                edges={zustandEdges}
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
            {shouldShowTraces && (
              <div 
                style={{ 
                  width: isSidebarOpen ? "40%" : `24px`,
                  height: "calc(100vh - 100px)",
                  transition: "width 0.3s ease",
                }}
              >
                <TracesDashboard
                  workflowId="wf-001"
                  traces={mockTraceData}
                  currentNodeId={selectedNodeId || undefined}
                  isOpen={isSidebarOpen}
                  onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                />
              </div>
            )}
          </div>
        </ReactFlowProvider>
      </div>
    </div>
  );
};
