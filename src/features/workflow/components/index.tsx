import React, { useState, useEffect } from "react";
import {
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FCX } from "@/types/types";
import { TracesDashboard } from "./TracesDashboard";
import { mockTraceData } from "../const/mockTraceData";
import { Header } from './Header';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/theme.scss';
import { 
  Category, 
  WorkflowHistory, 
  ProgressbarType 
} from '../types/types';
import { WorkflowHistories } from './WorkflowHistories';
import { useWorkflowStore } from '../stores/useWorkflowStore';
import { StepFunctionVisualizer } from './StepFunctionVisualizer';
import { useSSEStore } from '../stores/useSSEStore';

interface Props {
  className?: string;
  categories: Category[];
  initialHistories: WorkflowHistory[];
}

export const Workflow: FCX<Props> = ({ 
  className, 
  categories, 
  initialHistories 
}) => {
  
  const { 
    addWorkflow, 
    getWorkflowBySession, 
    generateSessionId 
  } = useWorkflowStore();
  
  const { connectionStatus } = useSSEStore();
  
  const [sessionId] = useState(() => generateSessionId());
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [thesisTitle, setThesisTitle] = useState('');
  const [histories, setHistories] = useState<WorkflowHistory[]>(initialHistories);
  const [progressBar, setProgressBar] = useState<ProgressbarType>({
    percentage: 0,
    status: 'processing'
  });

  // ReactFlow states
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { theme } = useTheme();
  // 進行中のワークフローの復元
  useEffect(() => {
    const activeWorkflow = getWorkflowBySession(sessionId);
    console.log('activeWorkflow', activeWorkflow);
    if (activeWorkflow) {
      setWorkflowId(activeWorkflow.workflowId);
      setThesisTitle(activeWorkflow.title);
      setSelectedCategory(activeWorkflow.category);

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

  return (
    <div className={`${className} w-full h-full`}>
      <Header 
        title={thesisTitle}
        onStart={handleStartWorkflow}
        onTitleChange={setThesisTitle}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
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
        />
        <div className="w-full relative flex overflow-hidden">
          <div 
            style={{
              width: shouldShowTraces ? "60%" : "100%",
              height: "calc(100vh - 100px)",
              transition: "width 0.3s ease",
            }}
          >
            <ReactFlowProvider>
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
              <StepFunctionVisualizer
                workflowId={workflowId}
                onNodeClick={setSelectedNodeId}
                selectedNodeId={selectedNodeId}
              />
            </div>
            </ReactFlowProvider>
          </div>
          {shouldShowTraces && (
            <TracesDashboard
              workflowId="wf-001"
              traces={mockTraceData}
              currentNodeId={selectedNodeId || undefined}
              isOpen={isSidebarOpen}
              onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
