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
  WorkflowHistory
} from '../types/types';
import { WorkflowHistories } from './WorkflowHistories';
import { useWorkflowStore } from '../stores/useWorkflowStore';
import { WorkflowVisualizer } from './WorkflowVisualizer';
import { useProgressStore } from '../stores/useProgressStore';

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
  
  const { addWorkflow, getWorkflowBySession, generateSessionId } = useWorkflowStore();
  
  const { progressBar } = useProgressStore();
  
  const [sessionId] = useState(() => generateSessionId());
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [thesisTitle, setThesisTitle] = useState('');
  const [histories, setHistories] = useState<WorkflowHistory[]>(initialHistories);

  // ReactFlow states
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { theme } = useTheme();
  // 進行中のワークフローの復元
  useEffect(() => {
    const activeWorkflow = getWorkflowBySession(sessionId);
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
          status: 'PROCESSING',
          timestamp: activeWorkflow.timestamp
        }, ...filteredHistories];
      });
    }
  }, [sessionId, getWorkflowBySession]);

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
      status: 'PROCESSING',
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
          <ReactFlowProvider>
            <div 
              style={{ 
                position: 'relative',
                width: "100%",
                height: "calc(100vh - 100px)",
                transition: "all 0.5s ease",
                background: theme === 'dark' 
                  ? "linear-gradient(180deg, rgba(14, 14, 20, 0.85), rgba(22, 22, 32, 0.82))" 
                  : "linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.95))",
                display: 'flex',
              }}
            >
              <div style={{
                width: (progressBar.status === 'SUCCESS' || progressBar.status === 'FAILED') 
                  ? (isSidebarOpen ? "60%" : "100%")
                  : "100%",
                height: "100%",
                transition: "width 0.5s ease",
              }}>
                <WorkflowVisualizer
                  workflowId={workflowId}
                  onNodeClick={setSelectedNodeId}
                  selectedNodeId={selectedNodeId}
                />
              </div>
              {(progressBar.status === 'SUCCESS' || progressBar.status === 'FAILED') && (
                <div style={{ 
                  width: "40%",
                  height: "100%",
                  transform: `translateX(${isSidebarOpen ? '0' : '100%'})`,
                  transition: "transform 0.5s ease",
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  borderLeft: theme === 'dark' 
                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                    : '1px solid rgba(0, 0, 0, 0.1)',
                }}>
                  <TracesDashboard
                    workflowId={workflowId || ""}
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
    </div>
  );
};
