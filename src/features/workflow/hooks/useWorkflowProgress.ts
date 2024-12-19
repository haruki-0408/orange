import { useEffect, useState } from "react";
import { useWorkflowStore } from "../stores/useWorkflowStore";
import { useFlowStore } from "../stores/useFlowStore";
import { ProgressData, StateType, ConnectionStatus, WorkflowNodeId } from "../types/types";

// 並列実行されるノード
const PARALLEL_NODES = ["formula-gen-lambda", "table-gen-lambda", "graph-gen-lambda"];

export const useWorkflowProgress = (workflowId: string | null) => {
  const { removeWorkflow } = useWorkflowStore();
  const { updateNodeStatus, updateNodeData, updateEdgeStatus, nodes, edges } = useFlowStore();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [isInitialized, setIsInitialized] = useState(false);

  const workflowSequence: WorkflowNodeId[] = [
    "start",
    "api-gateway",
    "format-lambda",
    "prompt-lambda",
    "callback-queue",
    "ai-request-lambda",
    "validation-lambda",
    "callback-success-lambda",
    "data-fix-lambda",
    "formula-gen-lambda",
    "table-gen-lambda",
    "graph-gen-lambda",
    "pdf-format-lambda",
    "end"
  ];

  // 最初のステップの初期化
  const initializeFirstStep = () => {
    if (isInitialized) return;
    updateNodeStatus("api-gateway", "progress");
    updateEdgeStatus("e-start-api", { targetNodeStatus: "progress" });
    setIsInitialized(true);
  };

  // callback-queueの成功時の処理
  const handleCallbackQueueSuccess = () => {
    updateNodeStatus("callback-queue", "success");
    updateNodeStatus("ai-request-lambda", "progress");
    updateEdgeStatus("e-prompt-callback", { targetNodeStatus: "success" });
    updateEdgeStatus("e-callback-ai", { targetNodeStatus: "progress" });
  };

  // スキーマバリデーション成功時の特別処理
  const handleValidationSuccess = () => {
    updateEdgeStatus("e-ai-validation", { targetNodeStatus: "success" });
    updateEdgeStatus("e-validation-choice", { targetNodeStatus: "success" });
    updateEdgeStatus("e-choice-success", { targetNodeStatus: "progress" });
    updateNodeStatus("callback-success-lambda", "progress");
  };

  // スキーマバリデーション失敗時の特別処理
  const handleValidationFailed = () => {
    updateNodeStatus("validation-lambda", "success");
    updateEdgeStatus("e-validation-choice", { targetNodeStatus: "success" });
    updateEdgeStatus("e-choice-fix", { targetNodeStatus: "progress" });
    updateNodeStatus("data-fix-lambda", "progress");
  };

  // 並列ノードの進捗処理
  const handleParallelNodeProgress = () => {
    updateNodeStatus("formula-gen-lambda", "progress");
    updateNodeStatus("table-gen-lambda", "progress");
    updateNodeStatus("graph-gen-lambda", "progress");
    updateEdgeStatus("e-choice-success", { targetNodeStatus: "success" });
    updateEdgeStatus("e-callback-success-lambda-callback", { targetNodeStatus: "success" });
    updateEdgeStatus("e-callback-formula", { targetNodeStatus: "progress" });
    updateEdgeStatus("e-callback-table", { targetNodeStatus: "progress" });
    updateEdgeStatus("e-callback-graph", { targetNodeStatus: "progress" });
  };

  // pdf-format-lambdaの成功時の処理
  const handlePdfFormatLambdaSuccess = () => {
    updateNodeStatus("pdf-format-lambda", "success");
    updateEdgeStatus("e-pdf-end", { targetNodeStatus: "success" });
  };

  const updateWorkflowState = (nodeId: WorkflowNodeId, status: string) => {
    // callback-queueの特別処理
    if (nodeId === "callback-queue" && status === "success") {
      handleCallbackQueueSuccess();
      return;
    }

    // validation-lambdaの特別処理
    if (nodeId === "validation-lambda" && status !== "failed") {
      updateNodeStatus(nodeId, status as StateType);

      if (status === "success") {
        handleValidationSuccess();
        return;
      }

      if (status === "validation-failed") {
        handleValidationFailed();
        return;
      }
    }

    // callback-success-lambdaの成功時の処理
    if (nodeId === "callback-success-lambda" && status === "success") {
      handleParallelNodeProgress();
      return;
    }

    const isParallelNode = PARALLEL_NODES.includes(nodeId);
    // if (!isParallelNode) {
    //   const nodeIndex = workflowSequence.indexOf(nodeId);
    //   if (nodeIndex === -1) return;
    // }

    // ノードの進捗処理
    updateNodeStatus(nodeId, status as StateType);

    // エッジの進捗処理
    edges.forEach((edge) => {
      const source = edge.source as WorkflowNodeId;
      const target = edge.target as WorkflowNodeId;

      if (source === nodeId || target === nodeId) {
        if (target === nodeId) {
          updateEdgeStatus(edge.id, { targetNodeStatus: status as StateType });
        }

        if (source === nodeId && status === "success") {
          // 通常の遷移処理
          const nextNode = edge.target as WorkflowNodeId;
          const currentNodeState = nodes.find((n) => n.id === nextNode)?.data?.status;
          if (currentNodeState === "ready") {
            // 並列ノードの進捗処理
            if (isParallelNode) {
              const allParallelNodesCompleted = PARALLEL_NODES.every(
                (parallelNode) =>
                  parallelNode === source || 
                    (nodes.find((n) => n.id === parallelNode && n.id !== source)?.data?.status === "success")
              );

              if (allParallelNodesCompleted) {
                updateNodeStatus("pdf-format-lambda", "progress");
                return;
              }
            } else {
              updateNodeStatus(nextNode, "progress");
            }

            updateEdgeStatus(edge.id, { targetNodeStatus: "progress" });
          }
        }
      }
    });
  };

  useEffect(() => {
    if (!workflowId) return;

    let isFirstMessage = true;
    setConnectionStatus("connecting");
    const eventSource = new EventSource(`/api/sse/${workflowId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ProgressData;

        // 最初のメッセージで接続確立を確認
        if (isFirstMessage) {
          isFirstMessage = false;
          setConnectionStatus("connected");
          // 初期化処理を遅延実行
          setTimeout(() => {
            initializeFirstStep();
          }, 500);
          return;
        }

        updateWorkflowState(data.state_name, data.status);
        updateNodeData(data.state_name, {
          timestamp: data.timestamp,
          logs: data.logs,
          metrics: data.metrics
        });

        if (data.status === "success" && data.state_name === "end") {
          setConnectionStatus("completed");
          removeWorkflow(workflowId);
        } else if (data.status === "failed") {
          setConnectionStatus("error");
          removeWorkflow(workflowId);
        }
      } catch (error) {
        console.error("Error processing SSE message:", error);
        setConnectionStatus("error");
        removeWorkflow(workflowId);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE Error:", error);
      setConnectionStatus("error");
      eventSource.close();
    };

    return () => {
      eventSource.close();
      setConnectionStatus("disconnected");
      setIsInitialized(false);
    };
  }, [workflowId, updateNodeStatus, updateNodeData, updateEdgeStatus, removeWorkflow]);

  return { connectionStatus };
};
