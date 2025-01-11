import { useCallback } from "react";
import { StateType, WorkflowNodeId, NodeData, ProgressbarType, ProgressData, EdgeData } from "../types/types";
import { getWorkflowProgress } from "@/app/actions/workflow";
import { useProgressStore } from '../stores/useProgressStore';
import { Node, Edge, useReactFlow, useNodesState, useEdgesState } from "@xyflow/react";
import { initialNodes } from "../const/initialNodes";
import { initialEdges } from "../const/initialEdges";
import { WorkflowHistory, ActiveWorkflow } from "../types/types";
import { progressService } from "../services/progressService";
import useSWR from 'swr';

interface WorkflowProgressProps {
  // nodes: Node[];
  // edges: Edge[];
  // setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  // setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  // getNodes: () => Node[];
  // getNode: (id: string) => Node | undefined;
  // getEdges: () => Edge[];
  // getEdge: (id: string) => Edge | undefined;
  selectedWorkflow: WorkflowHistory | ActiveWorkflow | null;
  // updateProgress: (percentage: number, status: ProgressbarType['status']) => void;
}

// 進行状況を管理するフック
export const useWorkflowProgress = ({
  // nodes,
  // edges,
  // setNodes,
  // setEdges,
  // getNode,
  // getEdge,
  // getNodes,
  // getEdges,
  selectedWorkflow,
  // updateProgress
}: WorkflowProgressProps) => {
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);
  const { getEdge, getNode, getNodes, getEdges } = useReactFlow();
  const PARALLEL_NODES = ["formula-gen-lambda", "table-gen-lambda", "graph-gen-lambda"];
  const workflowId = selectedWorkflow?.workflow_id;
  const { updateProgress } = useProgressStore();

  // ワークフロー進行状況の取得
  const { data: workflowProgressData } = useSWR(
    workflowId ? ['workflow-progress', workflowId] : null,
    () => progressService.fetchWorkflowProgress(workflowId!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 2000,
    }
  );

  // ノードとエッジの状態をリセット
  const resetState = useCallback(async () => {
    return new Promise<void>(resolve => {
      setNodes(initialNodes);
      setEdges(initialEdges);
      // 次のレンダリングサイクルで状態が更新されるのを待つ
      setTimeout(resolve, 0);
    });
  }, []);

  // ノードの状態を更新
  const updateNode = useCallback((nodeId: string, data: Partial<NodeData>) => {
    setNodes(nodes => nodes.map(node => 
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    ));
  }, []);

  // エッジの状態を更新
  const updateEdge = useCallback((edgeId: string, data: Partial<EdgeData>) => {
    setEdges(edges => edges.map(edge => 
      edge.id === edgeId ? { ...edge, data: { ...edge.data, ...data } } : edge
    ));
  }, []);

  // ワークフロー全体を失敗状態に
  const handleWorkflowToFailed = useCallback(() => {
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
    (nodeId: WorkflowNodeId, status: StateType, validationCount?: number) => {
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
            
            if (getEdge("e-fix-validation")?.data?.targetNodeStatus === "progress" || validationCount! > 1) {
              updateEdge("e-fix-validation", { targetNodeStatus: "success" });
            }
          } else if (status === "validation-failed") {
            updateNode("validation-lambda", { status: "success" });
            updateEdge("e-ai-validation", { targetNodeStatus: "success" });
            if (getEdge("e-fix-validation")?.data?.targetNodeStatus === "progress" || validationCount! > 1) {
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
            } else if (getEdge("e-fix-validation")?.data?.targetNodeStatus === "progress" || validationCount! > 1) {
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
    [nodes, edges, getNode, getEdge, updateNode, updateEdge]
  );

  // プログレスバーの更新を行う関数
  const updateProgressBar = useCallback(() => {
    const currentNodes = getNodes();
    const { percentage, status } = progressService.calculateProgress(currentNodes);

    updateProgress(percentage, status);
  }, [getNodes, updateProgress]);

  // ワークフローの状態更新
  const updateWorkflowState = useCallback(
    async (nodeId: WorkflowNodeId, status: StateType, validationCount?: number) => {
      return new Promise<void>(resolve => {
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

        
        if (isSpecialNode) {
          handleSpecificNodeUpdate(nodeId, status, validationCount);
        } else {
          const currentEdges = getEdges();

          // 通常Stateはそのノードと前のエッジをstatusに更新
          for(const edge of currentEdges) {
            if (edge.target === nodeId) {
              updateEdge(edge.id, { targetNodeStatus: status });
            }
          }

          // 通常Stateの成功時は次ノードと次エッジを進行中に
          if (status === "success") {
            const nextEdges = currentEdges.filter(e => e.source === nodeId);
            for(const edge of nextEdges) {
                const targetNode = getNode(edge.target);

                if (targetNode?.data?.status === "ready" ) {
                  updateNode(edge.target, { status: "progress" });
                  updateEdge(edge.id, { targetNodeStatus: "progress" });
                }
            }
          }
        }

        // 失敗時の共通処理
        if (status === "failed") {
          handleWorkflowToFailed();
        }
        
        // 次のレンダリングサイクルで状態更新を確実に反映
        setTimeout(resolve, 100);
        // resolve();
      });
    },
    [edges, nodes, updateNode, updateEdge, handleSpecificNodeUpdate, handleWorkflowToFailed]
  );

  // SSEからのメッセージを処理
  const handleMessage = (data: ProgressData) => {
    if (!["success", "failed", "validation-failed"].includes(data.status)) return;

    // ワークフローの状態を更新
    updateWorkflowState(data.state_name, data.status as StateType);
    
    // プログレスバーの更新
    if (data.state_name !== "data-fix-lambda") {
      setTimeout(() => {
        updateProgressBar();
      }, 100);
    }
    
  };

  // 進捗状況を反映
  const reflectWorkflowProgress = useCallback(async () => {
    if (!workflowId) {
      useProgressStore.getState().resetProgress();
      return;
    }

    // ワークフローの進捗状況を取得
    const progressRecords = await getWorkflowProgress(workflowId);
    
    if (progressRecords.length === 0) {
      updateNode("api-gateway", { status: "progress" });
      updateEdge("e-start-api", { targetNodeStatus: "progress" });
      
      return;
    }

    for (const record of progressRecords) {
      if (record.status === "success") {
        const validationCount = progressRecords.filter(r => r.state_name === "validation-lambda").length;
        await updateWorkflowState(record.state_name, "success", validationCount);
      } else if (record.status === "failed") {
        const validationCount = progressRecords.filter(r => r.state_name === "validation-lambda").length;
        await updateWorkflowState(record.state_name, "failed", validationCount);
      } else if (record.status === "validation-failed") {
        await updateWorkflowState(record.state_name, "success");
      }
    }

    // プログレスバーの更新 マクロタスク
    setTimeout(() => {
      updateProgressBar();
    }, 0);
  }, [workflowId, updateWorkflowState, updateNode, updateEdge, updateProgressBar]);

  return {
    nodes,
    edges,
    workflowProgressData,
    resetState,
    reflectWorkflowProgress,
    handleMessage
  }
};