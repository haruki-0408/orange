import React, { useState, useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FCX } from "@/types/types";
import { TracesDashboard } from "./TracesDashboard";
import { Header } from "./Header";
import { useTheme } from "../contexts/ThemeContext";
import "../styles/theme.scss";
import { Category, WorkflowHistory, ProgressbarType } from "../types/types";
import { WorkflowHistories } from "./WorkflowHistories";
import { useWorkflowStore } from "../stores/useWorkflowStore";
import { WorkflowVisualizer } from "./WorkflowVisualizer";
import { useProgressStore } from "../stores/useProgressStore";
import { startWorkflow } from "@/app/actions/workflow";
import { useWorkflowHistories } from "../hooks/useWorkflowHistories";
import { useSSEStore } from "../stores/useSSEStore";

interface Props {
  className?: string;
  categories: Category[];
  initialHistories: WorkflowHistory[];
}

export const Workflow: FCX<Props> = ({ className, categories, initialHistories }) => {
  const { addWorkflow, getActiveWorkflowBySession, generateSessionId } = useWorkflowStore();
  const { progressBar } = useProgressStore();
  const [sessionId] = useState(() => generateSessionId());
  const { setSelectedWorkflow } = useWorkflowStore();
  const { selectedWorkflow, isActiveWorkflow } = useWorkflowStore();
  const { terminateSSE } = useSSEStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [thesisTitle, setThesisTitle] = useState("");

  // ReactFlow states
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { theme } = useTheme();

  const { histories, setHistories, handleUpdate, refetchHistories } = useWorkflowHistories({
    initialHistories
  });

  // ワークフロー成功/失敗時の処理 登録
  useEffect(() => {
    useProgressStore.getState().setOnProgressComplete(async (status: ProgressbarType["status"]) => {
      if (!selectedWorkflow || !isActiveWorkflow(selectedWorkflow.workflow_id)) return;

      try {
        // SSE接続を終了
        terminateSSE();

        // DynamoDBの履歴とhistoriesを更新
        handleUpdate(selectedWorkflow, status);

        // 履歴を再取得
        refetchHistories();

        // アクティブワークフローを削除
        useWorkflowStore.getState().removeWorkflow(selectedWorkflow.workflow_id);

      } catch (error) {
        console.error("Failed to update workflow history:", error);
      }
    });

    return () => {
      useProgressStore.getState().setOnProgressComplete(undefined);
    };
  }, [selectedWorkflow, terminateSSE, isActiveWorkflow]);

  // 進行中のワークフローの復元
  useEffect(() => {
    const activeWorkflow = getActiveWorkflowBySession(sessionId);
    if (activeWorkflow) {
      setThesisTitle(activeWorkflow.title);
      setSelectedCategory(activeWorkflow.category);
      setSelectedWorkflow(activeWorkflow);

      setHistories((prev) => {
        const filteredHistories = prev.filter(
          (history) => history.workflow_id !== activeWorkflow.workflow_id
        );
        return [
          {
            workflow_id: activeWorkflow.workflow_id,
            title: activeWorkflow.title,
            category: activeWorkflow.category,
            status: "PROCESSING",
            timestamp: activeWorkflow.timestamp
          },
          ...filteredHistories
        ];
      });
    }
  }, [sessionId, getActiveWorkflowBySession]);

  // ワークフロー生成開始
  const handleStartWorkflow = async () => {
    if (!thesisTitle.trim() || !selectedCategory) {
      alert("論文タイトルとカテゴリを選択してください");
      return;
    }

    const newWorkflowId = addWorkflow(thesisTitle, selectedCategory);
    if (!newWorkflowId) {
      alert("現在処理中のワークフローがあります。完了後に新しい生成を開始してください。");
      return;
    }

    startWorkflow(newWorkflowId, thesisTitle, selectedCategory);

    setHistories((prev) => [
      {
        workflow_id: newWorkflowId,
        title: thesisTitle,
        category: selectedCategory,
        status: "PROCESSING",
        timestamp: new Date().toISOString()
      },
      ...prev
    ]);

    setSelectedWorkflow({
      workflow_id: newWorkflowId,
      title: thesisTitle,
      category: selectedCategory,
      status: "PROCESSING",
      timestamp: new Date().toISOString()
    });
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
      />
      <div className="flex w-full h-[calc(100vh-100px)]">
        <WorkflowHistories histories={histories} />
        <div className="w-full relative flex overflow-hidden">
          <ReactFlowProvider>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "calc(100vh - 100px)",
                transition: "all 0.5s ease",
                background:
                  theme === "dark"
                    ? "linear-gradient(180deg, rgba(14, 14, 20, 0.85), rgba(22, 22, 32, 0.82))"
                    : "linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.95))",
                display: "flex"
              }}
            >
              <div
                style={{
                  width:
                    progressBar.status === "SUCCESS" || progressBar.status === "FAILED"
                      ? isSidebarOpen
                        ? "60%"
                        : "100%"
                      : "100%",
                  height: "100%",
                  transition: "width 0.5s ease"
                }}
              >
                <WorkflowVisualizer
                  onNodeClick={setSelectedNodeId}
                  selectedNodeId={selectedNodeId}
                />
              </div>
              {(progressBar.status === "SUCCESS" || progressBar.status === "FAILED") && (
                <div
                  style={{
                    width: "40%",
                    height: "100%",
                    transform: `translateX(${isSidebarOpen ? "0" : "100%"})`,
                    transition: "transform 0.5s ease",
                    position: "absolute",
                    right: 0,
                    top: 0,
                    borderLeft:
                      theme === "dark"
                        ? "1px solid rgba(255, 255, 255, 0.1)"
                        : "1px solid rgba(0, 0, 0, 0.1)"
                  }}
                >
                  <TracesDashboard
                    // traces={mockTraceData}
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
