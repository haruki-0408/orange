import { useEffect, useCallback, useState } from "react";
import { useWorkflowStore } from "../stores/useWorkflowStore";
import { ProgressData, StateType, WorkflowNodeId, NodeData, ProgressbarType } from "../types/types";
import { useSSEStore } from "../stores/useSSEStore";
import { getWorkflowProgress } from "@/app/actions/workflow";
import { initialNodes } from "../const/initialNodes";
import { initialEdges } from "../const/initialEdges";
import { useReactFlow } from "@xyflow/react";
import { useProgressStore } from '../stores/useProgressStore';

const PARALLEL_NODES = ["formula-gen-lambda", "table-gen-lambda", "graph-gen-lambda"];


export const useWorkflowProgress = (workflowId: string | null) => {
  const { isActiveWorkflow } = useWorkflowStore();
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const { getEdge, getNode, getNodes } = useReactFlow();
  const { connectionStatus, initializeSSE, terminateSSE } = useSSEStore();
  const { updateProgress } = useProgressStore();

  // ノードとエッジの状態をリセット
  const resetState = useCallback(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, []);

  // ノードの状態を更新
  const updateNode = useCallback((nodeId: string, data: Partial<NodeData>) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      )
    );
  }, []);

  // エッジの状態を更新
  const updateEdge = useCallback((edgeId: string, data: any) => {
    setEdges((edges) =>
      edges.map((edge) =>
        edge.id === edgeId ? { ...edge, data: { ...edge.data, ...data } } : edge
      )
    );
  }, []);

  // ワークフロー全体を失敗状態に
  const handleWorkflowToFailed = useCallback((failedNodeId: string) => {
    // 失敗したノードと既に状態が決まっているノード以外は状態ストップ
    setNodes((nodes) =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          status:
            node.data.status !== "success" && node.data.status !== "failed"
              ? "stopped"
              : node.data.status
        }
      }))
    );

    // 失敗したエッジと既に状態が決まっているエッジ以外は状態ストップ
    setEdges((edges) =>
      edges.map((edge) => ({
        ...edge,
        data: {
          ...edge.data,
          targetNodeStatus:
            edge.data?.targetNodeStatus !== "success" && edge.data?.targetNodeStatus !== "failed"
              ? "stopped"
              : edge.data?.targetNodeStatus
        }
      }))
    );
  }, []);

  // 特定のノードの状態更新処理
  const handleSpecificNodeUpdate = useCallback(
    (nodeId: WorkflowNodeId, status: StateType) => {
      const handlers: Partial<Record<WorkflowNodeId, () => void>> = {
        "callback-queue": () => {
          if (status === "success") {
            updateNode("ai-request-lambda", { status: "progress" });
            updateEdge("e-prompt-callback", { targetNodeStatus: "success" });
            updateEdge("e-callback-ai", { targetNodeStatus: "progress" });
          } else if (status === "failed") {
            updateNode("callback-queue", { status: "failed" });
            updateEdge("e-prompt-callback", { targetNodeStatus: "failed" });
          }
        },
        "validation-lambda": () => {
          if (status === "success") {
            updateEdge("e-ai-validation", { targetNodeStatus: "success" });
            updateEdge("e-validation-choice", { targetNodeStatus: "success" });
            updateEdge("e-choice-success", { targetNodeStatus: "progress" });
            updateNode("callback-success-lambda", { status: "progress" });
            if (getEdge("e-fix-validation")?.data?.targetNodeStatus === "progress") {
              updateEdge("e-fix-validation", { targetNodeStatus: "success" });
            }
          } else if (status === "validation-failed") {
            updateNode("validation-lambda", { status: "success" });
            updateEdge("e-ai-validation", { targetNodeStatus: "success" });
            if (getEdge("e-fix-validation")?.data?.targetNodeStatus === "progress") {
              updateEdge("e-fix-validation", { targetNodeStatus: "success" });
            }
            updateEdge("e-validation-choice", { targetNodeStatus: "success" });
            updateEdge("e-choice-fix", { targetNodeStatus: "progress" });
            updateNode("data-fix-lambda", { status: "progress" });
          } else if (status === "failed") {
            // e-ai-validation か e-fix-validation のどちらからのfailedかを確認
            if (getEdge("e-ai-validation")?.data?.targetNodeStatus === "progress") {
              // AI Lambda からの失敗
              updateEdge("e-ai-validation", { targetNodeStatus: "failed" });
            } else if (getEdge("e-fix-validation")?.data?.targetNodeStatus === "progress") {
              // データ修正からの失敗
              updateEdge("e-fix-validation", { targetNodeStatus: "failed" });
            }
          }
        },
        "data-fix-lambda": () => {
          if (status === "success") {
            updateEdge("e-choice-fix", { targetNodeStatus: "success" });
            // ai-request-lambda から validation-lambda までのエッジは更新しない
            updateEdge("e-fix-validation", { targetNodeStatus: "progress" });
            updateNode("validation-lambda", { status: "progress" });
          } else if (status === "failed") {
            updateEdge("e-choice-fix", { targetNodeStatus: "failed" });
          }
        },
        "callback-success-lambda": () => {
          if (status === "success") {
            PARALLEL_NODES.forEach((nodeId) => {
              updateNode(nodeId, { status: "progress" });
              updateEdge(`e-callback-${nodeId.split("-")[0]}`, { targetNodeStatus: "progress" });
            });
            updateEdge("e-choice-success", { targetNodeStatus: "success" });
            updateEdge("e-callback-success-lambda-callback", { targetNodeStatus: "success" });
          } else if (status === "failed") {
            updateEdge("e-choice-success", { targetNodeStatus: "failed" });
          }
        },
        "pdf-format-lambda": () => {
          if (status === "success") {
            updateNode("pdf-format-la mbda", { status: "success" });
            updateEdge("e-formula-pdf", { targetNodeStatus: "success" });
            updateEdge("e-table-pdf", { targetNodeStatus: "success" });
            updateEdge("e-graph-pdf", { targetNodeStatus: "success" });
            updateEdge("e-pdf-end", { targetNodeStatus: "success" });
          } else if (status === "failed") {
            updateNode("pdf-format-lambda", { status: "failed" });
            updateEdge("e-formula-pdf", { targetNodeStatus: "failed" });
            updateEdge("e-table-pdf", { targetNodeStatus: "failed" });
            updateEdge("e-graph-pdf", { targetNodeStatus: "failed" });
            updateEdge("e-pdf-end", { targetNodeStatus: "failed" });
          }
        },
        "formula-gen-lambda": () => {
          if (status === "success") {
            // 他の2つのノードの状態を確認
            const tableNode = getNode("table-gen-lambda");
            const graphNode = getNode("graph-gen-lambda");
            
            updateEdge("e-callback-formula", { targetNodeStatus: "success" });
            
            if (tableNode?.data.status !== "failed" && graphNode?.data.status !== "failed") {
              updateEdge("e-formula-pdf", { targetNodeStatus: "progress" });
            }
            if (tableNode?.data.status === "success" && graphNode?.data.status === "success") {
              updateNode("pdf-format-lambda", { status: "progress" });
            }
          } else if (status === "failed") {
            updateEdge("e-callback-formula", { targetNodeStatus: "failed" });
          }
        },
        "table-gen-lambda": () => {
          if (status === "success") {
            // 他の2つのノードの状態を確認
            const formulaNode = getNode("formula-gen-lambda");
            const graphNode = getNode("graph-gen-lambda");
            
            updateEdge("e-callback-table", { targetNodeStatus: "success" });

            if (formulaNode?.data.status !== "failed" && graphNode?.data.status !== "failed") {
              updateEdge("e-table-pdf", { targetNodeStatus: "progress" });
            }
            if (formulaNode?.data.status === "success" && graphNode?.data.status === "success") {
              updateNode("pdf-format-lambda", { status: "progress" });
            }
          } else if (status === "failed") {
            updateEdge("e-callback-table", { targetNodeStatus: "failed" });
          }
        },
        "graph-gen-lambda": () => {
          if (status === "success") {
            // 他の2つのノードの状態を確認
            const formulaNode = getNode("formula-gen-lambda");
            const tableNode = getNode("table-gen-lambda");
            
            updateEdge("e-callback-graph", { targetNodeStatus: "success" });
            
            if (formulaNode?.data.status !== "failed" && tableNode?.data.status !== "failed") {
              updateEdge("e-graph-pdf", { targetNodeStatus: "progress" });
            }

            if (formulaNode?.data.status === "success" && tableNode?.data.status === "success") {
              updateNode("pdf-format-lambda", { status: "progress" });
            }
          } else if (status === "failed") {
            updateEdge("e-callback-graph", { targetNodeStatus: "failed" });
          }
        },
      };

      handlers[nodeId]?.();
    },
    [getNode, updateNode, updateEdge]
  );

  // 進捗率を計算する関数
  const calculateProgress = useCallback((nodeId: string, status: StateType) => {
    const totalNodes = 11; // 進行に数えるノードの総数
    const completedNodes = getNodes().filter(
      node => node.data.status === 'success'
      || (node.id === nodeId && status === 'success')
    ).length;
    return Math.round((completedNodes / totalNodes) * 100);
  }, [nodes]);

  // ワークフローの状態更新
  const updateWorkflowState = useCallback(
    (nodeId: WorkflowNodeId, status: StateType) => {
      // 特別な遷移を持つノードの処理を優先
      const isSpecialNode = [
        "callback-queue",
        "validation-lambda",
        "callback-success-lambda",
        "pdf-format-lambda",
        "data-fix-lambda",
        "formula-gen-lambda",
        "table-gen-lambda",
        "graph-gen-lambda"
      ].includes(nodeId);

      // 対象ノードの更新
      if (status !== "validation-failed") {
        updateNode(nodeId, { status });
      }

      // 通常Stateの成功時は次のノードを進行中に
      if (isSpecialNode) {
        // 特別な遷移を持つノードとエッジの処理を優先
        handleSpecificNodeUpdate(nodeId, status);
      } else {

        // 通常Stateの成功時は次のノードを進行中に
        // ターゲットノードの状態を更新
        edges.forEach((edge) => {
          if (edge.target === nodeId) {
            updateEdge(edge.id, { targetNodeStatus: status });
          }
        });

        if (status === "success") {
          const outgoingEdges = edges.filter((e) => e.source === nodeId);
          outgoingEdges.forEach((edge) => {
            const targetNode = nodes.find((n) => n.id === edge.target);
            if (targetNode?.data?.status === "ready") {
              updateNode(edge.target, { status: "progress" });
              updateEdge(edge.id, { targetNodeStatus: "progress" });
            }
          });
        }
      }

      // 失敗時の共通処理
      if (status === "failed") {
        handleWorkflowToFailed(nodeId);
      }

      // プログレスバーの更新
      const newPercentage = calculateProgress(nodeId, status);
      updateProgress(
        newPercentage,
        status === 'failed' ? 'FAILED' : 
        newPercentage === 100 ? 'SUCCESS' : 'PROCESSING'
      );
    },
    [edges, nodes, updateNode, updateEdge, handleSpecificNodeUpdate, handleWorkflowToFailed, calculateProgress, updateProgress]
  );

  // 進捗状況を反映
  const reflectWorkflowProgress = useCallback(async () => {
    if (!workflowId) {
      useProgressStore.getState().resetProgress();
      return;
    }

    const progressRecords = await getWorkflowProgress(workflowId);
    if (progressRecords.length === 0) {
      updateNode("api-gateway", { status: "progress" });
      updateEdge("e-start-api", { targetNodeStatus: "progress" });
      return;
    }

    // 進捗状態を更新
    let successCount = 0;
    let hasFailed = false;

    progressRecords.forEach((record) => {
      if (record.status === "success") {
        successCount++;
        updateWorkflowState(record.state_name, "success");
      } else if (record.status === "failed" || record.status === "validation-failed") {
        hasFailed = true;
        updateWorkflowState(record.state_name, "failed");
      }
    });

    // 進捗バーの状態を更新
    const percentage = Math.round((successCount / 11) * 100);
    useProgressStore.getState().updateProgress(
      percentage,
      hasFailed ? 'FAILED' : percentage === 100 ? 'SUCCESS' : 'PROCESSING'
    );
  }, [workflowId, updateWorkflowState, updateNode, updateEdge]);

  // 初期化処理
  useEffect(() => {
    const initializeWorkflow = async () => {
      if (!workflowId) return;

      // 1. まず状態をリセット
      resetState();
      useProgressStore.getState().resetProgress();

      // 2. 進捗状況を反映
      await reflectWorkflowProgress();

      // 3. アクティブなワークフローの場合のみSSE接続を開始
      if (isActiveWorkflow(workflowId)) {
        const handleMessage = (data: ProgressData) => {
          if (!["success", "failed", "validation-failed", "progress"].includes(data.status)) return;
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
  }, [workflowId]);

  return {
    connectionStatus,
    nodes,
    edges
  };
};
