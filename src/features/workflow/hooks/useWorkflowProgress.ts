import { useEffect, useCallback } from "react";
import { useReactFlow, useNodes, useEdges } from '@xyflow/react';
import { useWorkflowStore } from "../stores/useWorkflowStore";
import { ProgressData, StateType, WorkflowNodeId, NodeData } from "../types/types";
import { useSSEStore } from "../stores/useSSEStore";
import { getActiveWorkflowProgress } from '@/app/actions/workflow';

const PARALLEL_NODES = ["formula-gen-lambda", "table-gen-lambda", "graph-gen-lambda"];

export const useWorkflowProgress = (workflowId: string | null) => {
  const { removeWorkflow } = useWorkflowStore();
  const { updateNode, updateEdge, getNode } = useReactFlow();
  const nodes = useNodes();
  const edges = useEdges();
  const { connectionStatus, initializeSSE, terminateSSE } = useSSEStore();

  // ノードの状態を更新
  const updateNodeStatus = useCallback((nodeId: string, status: StateType) => {
    console.log('updateNode status', nodeId, status);
    updateNodeData(nodeId, { status });
  }, [updateNodeData]);

  // ノードのデータを更新
  // const updateNodeData = useCallback((nodeId: string, newData: Partial<NodeData>) => {
  //   console.log('updateNodeData', nodeId, newData);
  //   setNodes(nodes => 
  //     nodes.map(node => 
  //       node.id === nodeId 
  //         ? { ...node, data: { ...node.data, ...newData } }
  //         : node
  //     )
  //   );
  // }, [setNodes]);

  // エッジの状態を更新
  const updateEdgeStatus = useCallback((edgeId: string, data: { targetNodeStatus: StateType }) => {
    setEdges(edges => 
      edges.map(edge => 
        edge.id === edgeId 
          ? { ...edge, data: { ...edge.data, ...data } }
          : edge
      )
    );
  }, [setEdges]);

  // 特定のノードの状態更新処理
  const handleSpecificNodeUpdate = useCallback((nodeId: WorkflowNodeId, status: StateType | "validation-failed") => {
    const handlers: Partial<Record<WorkflowNodeId, () => void>> = {
      "callback-queue": () => {
        updateNodeStatus("callback-queue", "success");
        updateNodeStatus("ai-request-lambda", "progress");
        updateEdgeStatus("e-prompt-callback", { targetNodeStatus: "success" });
        updateEdgeStatus("e-callback-ai", { targetNodeStatus: "progress" });
      },
      "validation-lambda": () => {
        if (status === "success") {
          updateNodeStatus("validation-lambda", "success");
          updateEdgeStatus("e-ai-validation", { targetNodeStatus: "success" });
          updateEdgeStatus("e-validation-choice", { targetNodeStatus: "success" });
          updateEdgeStatus("e-choice-success", { targetNodeStatus: "progress" });
          updateNodeStatus("callback-success-lambda", "progress");
        } else if (status === "validation-failed") {
          updateNodeStatus("validation-lambda", "success");
          updateEdgeStatus("e-validation-choice", { targetNodeStatus: "success" });
          updateEdgeStatus("e-choice-fix", { targetNodeStatus: "progress" });
          updateNodeStatus("data-fix-lambda", "progress");
        }
      },
      "callback-success-lambda": () => {
        if (status === "success") {
          updateNodeStatus("callback-success-lambda", "success");
          PARALLEL_NODES.forEach(nodeId => {
            updateNodeStatus(nodeId, "progress");
            updateEdgeStatus(`e-callback-${nodeId.split("-")[0]}`, { targetNodeStatus: "progress" });
          });
          updateEdgeStatus("e-choice-success", { targetNodeStatus: "success" });
          updateEdgeStatus("e-callback-success-lambda-callback", { targetNodeStatus: "success" });
        }
      },
      "pdf-format-lambda": () => {
        updateNodeStatus("pdf-format-lambda", "success");
        updateEdgeStatus("e-formula-pdf", { targetNodeStatus: "success" });
        updateEdgeStatus("e-table-pdf", { targetNodeStatus: "success" });
        updateEdgeStatus("e-graph-pdf", { targetNodeStatus: "success" });
        updateEdgeStatus("e-pdf-end", { targetNodeStatus: "success" });
      }
    };

    handlers[nodeId]?.();
  }, [updateNodeStatus, updateEdgeStatus]);

  // 並列ノードの完了チェック
  const checkParallelNodesCompletion = useCallback((source: WorkflowNodeId) => {
    const allParallelNodesCompleted = PARALLEL_NODES.every(
      parallelNode => {
        if (parallelNode === source) return true;
        const node = getNode(parallelNode);
        return node?.data?.status === "success";
      }
    );

    if (allParallelNodesCompleted) {
      updateNodeStatus("pdf-format-lambda", "progress");
      return true;
    }
    return false;
  }, [getNode, updateNodeStatus]);

  // ワークフローの状態更新
  const updateWorkflowState = useCallback((nodeId: WorkflowNodeId, status: StateType) => {
    if (["callback-queue", "validation-lambda", "callback-success-lambda", "pdf-format-lambda"].includes(nodeId)) {
      handleSpecificNodeUpdate(nodeId, status);
      return;
    }

    updateNodeStatus(nodeId, status);
    const node = getNode(nodeId);
    
    if (node) {
      // 入力エッジの更新
      edges
        .filter(edge => edge.target === nodeId)
        .forEach(edge => {
          updateEdgeStatus(edge.id, { targetNodeStatus: status });
        });

      // 成功時の次のノードの処理
      if (status === "success") {
        edges
          .filter(edge => edge.source === nodeId)
          .forEach(edge => {
            const nextNode = getNode(edge.target);
            if (nextNode?.data?.status === "ready") {
              if (PARALLEL_NODES.includes(nodeId)) {
                checkParallelNodesCompletion(nodeId);
                updateEdgeStatus(edge.id, { targetNodeStatus: "progress" });
              } else {
                updateNodeStatus(nextNode.id, "progress");
                updateEdgeStatus(edge.id, { targetNodeStatus: "progress" });
              }
            }
          });
      }
    }
  }, [edges, getNode, updateNodeStatus, updateEdgeStatus, handleSpecificNodeUpdate, checkParallelNodesCompletion]);

  // 進捗状況を反映
  const reflectWorkflowProgress = useCallback(async () => {
    if (!workflowId) return;

    const progressRecords = await getActiveWorkflowProgress(workflowId);
    console.log('progressRecords', progressRecords);
    console.log(progressRecords.length);
    if (progressRecords.length === 0) {
      // レコードがない場合は初期状態として扱う
      setTimeout(() => {
        updateNodeStatus("api-gateway", "progress");
        updateEdgeStatus("e-start-api", { targetNodeStatus: "progress" });
      }, 500);
      return;
    }

    // 成功したステートを反映
    progressRecords.forEach(record => {
      if (record.status === 'success') {
        updateWorkflowState(record.state_name, 'success');
      } else if (record.status === 'failed' || record.status === 'validation-failed') {
        updateWorkflowState(record.state_name, 'failed');
      }
    });

    // 最後のレコードが進行中のステート
    const lastRecord = progressRecords[progressRecords.length - 1];
    if (lastRecord.status === 'success') {
      const nextNodes = edges
        .filter(edge => edge.source === lastRecord.state_name)
        .map(edge => edge.target);
      
      nextNodes.forEach(nodeId => {
        updateNodeStatus(nodeId, 'progress');
      });
    }
  }, [workflowId, updateWorkflowState, updateNodeStatus, updateEdgeStatus, edges]);

  useEffect(() => {
    console.log('workflowId', workflowId);
    if (!workflowId) return;

    const handleMessage = (data: ProgressData & { isFirstMessage?: boolean }) => {
      console.log('data', data);
      if (data.isFirstMessage) {
        reflectWorkflowProgress();
        return;
      }

      updateWorkflowState(data.state_name, data.status as StateType);
      updateNodeData(data.state_name, {
        timestamp: data.timestamp,
        logs: data.logs,
        metrics: data.metrics
      });

      if (data.status === "success" && data.state_name === "end") {
        removeWorkflow(workflowId);
      } else if (data.status === "failed") {
        removeWorkflow(workflowId);
      }
    };

    const cleanup = initializeSSE(workflowId, handleMessage);

    return () => {
      cleanup();
      terminateSSE();
    };
  }, [
    workflowId,
    reflectWorkflowProgress,
    updateNodeStatus,
    updateEdgeStatus,
    updateWorkflowState,
    updateNodeData,
    removeWorkflow,
    initializeSSE,
    terminateSSE
  ]);

  return { connectionStatus };
};
