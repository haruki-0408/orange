import React, { useEffect, useState } from "react";
import {
  ReactFlow,
  NodeTypes,
  EdgeTypes,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useReactFlow,
  useNodesState,
  useEdgesState
} from "@xyflow/react";
import { useWorkflowProgress } from "../../hooks/useWorkflowProgress";
import { useTheme } from "../../contexts/ThemeContext";
import styles from "./style.module.scss";
import CustomNode from "../CustomNode";
import { MainWorkflowGroup } from "../MainWorkflowGroup";
import { SubWorkflowGroup } from "../SubWorkflowGroup";
import ChoiceNode from "../ChoiceNode";
import TerminalNode from "../TerminalNode";
import { SupportingServicesGroup } from "../SupportingServicesGroup";
import CustomEdge from "../CustomEdge";
import { FCX } from "@/types/types";
import { useLoadingStore } from "../../stores/useLoadingStore";
import { LoadingOverlay } from "../LoadingOverlay";
import { initialNodes } from "../../const/initialNodes";
import { initialEdges } from "../../const/initialEdges";
import { useWorkflowStore } from "../../stores/useWorkflowStore";
import { useProgressStore } from "../../stores/useProgressStore";
import { useSSEStore } from "../../stores/useSSEStore";
import { ProgressData, StateType } from "../../types/types";

interface Props {
  onNodeClick: (nodeId: string) => void;
  selectedNodeId: string | null;
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

export const WorkflowVisualizer: FCX<Props> = ({ onNodeClick, selectedNodeId }) => {
  const { theme } = useTheme();
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);
  const { getEdge, getNode, getNodes } = useReactFlow();
  const { selectedWorkflow } = useWorkflowStore();
  const { isLoading, setLoading } = useLoadingStore();
  const { isActiveWorkflow } = useWorkflowStore();
  const { initializeSSE, terminateSSE } = useSSEStore();
  const { updateProgress } = useProgressStore();
  const [isReady, setIsReady] = useState(false);
  
  // ワークフロープログレスの初期化
  const { resetState, reflectWorkflowProgress, updateWorkflowState, updateProgressBar } = useWorkflowProgress({ 
    nodes, 
    setNodes, 
    edges, 
    setEdges, 
    getEdge, 
    getNode, 
    getNodes,
    selectedWorkflow,
    updateProgress
  });

  const onInit = () => {
    setIsReady(true);
  };

  // 初期化処理
  useEffect(() => {
    if (!selectedWorkflow || !isReady) return;
    
    // ローディング
    setLoading(true);

    const initializeWorkflow = async () => {
      try {
        // 1. まず状態をリセット
        await resetState();
        useProgressStore.getState().resetProgress();

        // 少し待機して状態の更新を確実にする
        await new Promise(resolve => setTimeout(resolve, 100));

        // 2. 進捗状況を反映
        await reflectWorkflowProgress();

        // 3. アクティブなワークフローの場合のみSSE接続を開始
        if (isActiveWorkflow(selectedWorkflow.workflow_id)) {

          const handleMessage = (data: ProgressData) => {
            if (!["success", "failed", "validation-failed", "progress"].includes(data.status)) return;

            // ワークフローの状態を更新
            updateWorkflowState(data.state_name, data.status as StateType);

            // プログレスバーの更新
            if (data.state_name !== "data-fix-lambda") {
              updateProgressBar();
            }
          };

          // SSE接続
          const cleanup = initializeSSE(selectedWorkflow.workflow_id, handleMessage);
          return () => {
            cleanup();
            terminateSSE();
          };
        }
      } finally {
        setLoading(false);
      }
    };
    
    initializeWorkflow();

    // return () => {
    //   // resetState();
    //   // useProgressStore.getState().resetProgress();
    // };
  }, [selectedWorkflow, isReady]);

  return (
    <div className={styles.visualizer}>
      {isLoading && <LoadingOverlay />}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => onNodeClick(node.id)}
        onInit={onInit}
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
      >
        <Controls showInteractive={false} className={styles.controls} />
        <MiniMap
          style={{
            backgroundColor: theme === "dark" ? "rgba(13, 13, 15, 0.98)" : "#ffffff",
            border:
              theme === "dark"
                ? "1px solid rgba(6, 182, 212, 0.15)"
                : "1px solid rgba(37, 99, 235, 0.1)",
            borderRadius: "8px",
            boxShadow:
              theme === "dark" ? "0 4px 20px rgba(0, 0, 0, 0.2)" : "0 4px 20px rgba(0, 0, 0, 0.05)"
          }}
          className={styles.minimap}
          maskColor={theme === "dark" ? "rgba(6, 182, 212, 0.08)" : "rgba(37, 99, 235, 0.05)"}
          nodeColor={(n) => {
            if (n.id === selectedNodeId) {
              return theme === "dark" ? "#06b6d4" : "#2563eb";
            }
            return theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(37, 99, 235, 0.1)";
          }}
        />
        <Background
          gap={20}
          size={1}
          color={theme === "dark" ? "rgba(0, 0, 0, 0.2)" : "#2563eb0d"}
          className={styles.background}
          variant={BackgroundVariant.Lines}
        />
      </ReactFlow>
    </div>
  );
};
