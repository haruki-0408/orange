import { useEffect, useCallback, useState } from "react";
import { useWorkflowStore } from "../stores/useWorkflowStore";
import { ProgressData, StateType, WorkflowNodeId, NodeData } from "../types/types";
import { useSSEStore } from "../stores/useSSEStore";
import { getWorkflowProgress } from '@/app/actions/workflow';
import { initialNodes } from "../const/initialNodes";
import { initialEdges } from "../const/initialEdges";
import { useReactFlow } from "@xyflow/react";

const PARALLEL_NODES = ["formula-gen-lambda", "table-gen-lambda", "graph-gen-lambda"];

export const useWorkflowProgress = (workflowId: string | null) => {
  const { removeWorkflow, isActiveWorkflow } = useWorkflowStore();
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const { connectionStatus, initializeSSE, terminateSSE } = useSSEStore();

  // ノードとエッジの状態をリセット
  const resetState = useCallback(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, []);

  // ノードの状態を更新
  const updateNode = useCallback((nodeId: string, data: Partial<NodeData>) => {
    setNodes(nodes => 
      nodes.map(node => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, ...data } }
          : node
      )
    );
  }, []);

  // エッジの状態を更新
  const updateEdge = useCallback((edgeId: string, data: any) => {
    setEdges(edges => 
      edges.map(edge => 
        edge.id === edgeId 
          ? { ...edge, data: { ...edge.data, ...data } }
          : edge
      )
    );
  }, []);

  // ワークフロー全体を失敗状態に
  const setWorkflowToFailed = useCallback(() => {
    setNodes(nodes => 
      nodes.map(node => ({
        ...node,
        data: { 
          ...node.data,
          status: node.data.status === 'success' ? 'success' : 'stopped'
        }
      }))
    );
    setEdges(edges => 
      edges.map(edge => ({
        ...edge,
        data: { 
          ...edge.data,
          targetNodeStatus: edge.data?.targetNodeStatus === 'success' ? 'success' : 'stopped'
        }
      }))
    );
  }, []);

  // 特定のノードの状態更新処理
  const handleSpecificNodeUpdate = useCallback((nodeId: WorkflowNodeId, status: StateType | "validation-failed") => {
    const handlers: Partial<Record<WorkflowNodeId, () => void>> = {
      "callback-queue": () => {
        updateNode("callback-queue", { status: "success" });
        updateNode("ai-request-lambda", { status: "progress" });
        updateEdge("e-prompt-callback", { targetNodeStatus: "success" });
        updateEdge("e-callback-ai", { targetNodeStatus: "progress" });
      },
      "validation-lambda": () => {
        if (status === "success") {
          updateNode("validation-lambda", { status: "success" });
          updateEdge("e-ai-validation", { targetNodeStatus: "success" });
          updateEdge("e-validation-choice", { targetNodeStatus: "success" });
          updateEdge("e-choice-success", { targetNodeStatus: "progress" });
          updateNode("callback-success-lambda", { status: "progress" });
        } else if (status === "validation-failed") {
          updateNode("validation-lambda", { status: "success" });
          updateEdge("e-validation-choice", { targetNodeStatus: "success" });
          updateEdge("e-choice-fix", { targetNodeStatus: "progress" });
          updateNode("data-fix-lambda", { status: "progress" });
        }
      },
      "callback-success-lambda": () => {
        if (status === "success") {
          updateNode("callback-success-lambda", { status: "success" });
          PARALLEL_NODES.forEach(nodeId => {
            updateNode(nodeId, { status: "progress" });
            updateEdge(`e-callback-${nodeId.split("-")[0]}`, { targetNodeStatus: "progress" });
          });
          updateEdge("e-choice-success", { targetNodeStatus: "success" });
          updateEdge("e-callback-success-lambda-callback", { targetNodeStatus: "success" });
        }
      },
      "pdf-format-lambda": () => {
        updateNode("pdf-format-lambda", { status: "success" });
        updateEdge("e-formula-pdf", { targetNodeStatus: "success" });
        updateEdge("e-table-pdf", { targetNodeStatus: "success" });
        updateEdge("e-graph-pdf", { targetNodeStatus: "success" });
        updateEdge("e-pdf-end", { targetNodeStatus: "success" });
      }
    };

    handlers[nodeId]?.();
  }, [updateNode, updateEdge]);

  // ワークフローの状態更新
  const updateWorkflowState = useCallback((nodeId: WorkflowNodeId, status: StateType) => {
    // 特別な遷移を持つノードの処理を優先
    if (["callback-queue", "validation-lambda", "callback-success-lambda", "pdf-format-lambda"].includes(nodeId)) {
      handleSpecificNodeUpdate(nodeId, status);
      return;
    }

    // 失敗状態の処理
    if (status === 'failed') {
      setWorkflowToFailed();
      return;
    }

    // 対象ノードの更新
    updateNode(nodeId, { status });

    // 関連エッジの更新
    edges.forEach(edge => {
      if (edge.source === nodeId || edge.target === nodeId) {
        updateEdge(edge.id, { targetNodeStatus: status });
      }
    });

    // 成功時は次のノードを進行中に
    if (status === 'success') {
      const outgoingEdges = edges.filter(e => e.source === nodeId);
      outgoingEdges.forEach(edge => {
        const targetNode = nodes.find(n => n.id === edge.target);
        if (targetNode?.data?.status === 'ready') {
          updateNode(edge.target, { status: 'progress' });
          updateEdge(edge.id, { targetNodeStatus: 'progress' });
        }
      });
    }
  }, [edges, nodes, updateNode, updateEdge, handleSpecificNodeUpdate, setWorkflowToFailed]);

  // 進捗状況を反映
  const reflectWorkflowProgress = useCallback(async () => {
    if (!workflowId) return;

    const progressRecords = await getWorkflowProgress(workflowId);
    if (progressRecords.length === 0) {
      updateNode("api-gateway", { status: "progress" });
      updateEdge("e-start-api", { targetNodeStatus: "progress" });
      return;
    }

    progressRecords.forEach(record => {
      if (record.status === 'success') {
        updateWorkflowState(record.state_name, 'success');
      } else if (record.status === 'failed' || record.status === 'validation-failed') {
        updateWorkflowState(record.state_name, 'failed');
      }
    });
  }, [workflowId, updateWorkflowState, updateNode, updateEdge]);

  // 初期化処理
  useEffect(() => {
    const initializeWorkflow = async () => {
      if (!workflowId) return;

      // 1. まず状態をリセット
      resetState();

      // 2. 進捗状況を反映
      await reflectWorkflowProgress();

      // 3. アクティブなワークフローの場合のみSSE接続を開始
      if (isActiveWorkflow(workflowId)) {
        const handleMessage = (data: ProgressData & { isFirstMessage?: boolean }) => {
          if (data.isFirstMessage) return;
          updateWorkflowState(data.state_name, data.status as StateType);
        };

        const cleanup = initializeSSE(workflowId, handleMessage);
        return () => {
          cleanup();
          terminateSSE();
        };
      }
    };

    initializeWorkflow();
  }, [
    workflowId,
    
  ]);

  return { 
    connectionStatus,
    nodes,
    edges
  };
};
