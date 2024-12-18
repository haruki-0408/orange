import { useEffect, useState } from 'react';
import { useWorkflowStore } from '../stores/useWorkflowStore';
import { useFlowStore } from '../stores/useFlowStore';
import { ProgressData, StateType, ConnectionStatus, WorkflowNodeId } from '../types/types';
import { getSessionId } from '../../../utils/session';

// 並列実行されるノード
const PARALLEL_NODES = [
  'formula-gen-lambda',
  'table-gen-lambda',
  'graph-gen-lambda'
];

export const useWorkflowProgress = (workflowId: string | null) => {
  const { isWorkflowOwner } = useWorkflowStore();
  const { 
    updateNodeStatus, 
    updateNodeData,
    updateEdgeStatus,
    nodes,
    edges
  } = useFlowStore();
  const [sessionId, setSessionId] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  const workflowSequence: WorkflowNodeId[] = [
    'start',  
    'api-gateway',
    'format-lambda',
    'prompt-lambda',
    'callback-queue',
    'ai-request-lambda',
    'validation-lambda',
    'callback-success-lambda',
    'data-fix-lambda',
    'formula-gen-lambda',
    'table-gen-lambda',
    'graph-gen-lambda',
    'pdf-format-lambda',
    'end'
  ];

  // 検証失敗時の特別処理
  const handleValidationFailed = () => {
    // validation-lambdaからvalidation-choiceへの遷移
    updateNodeStatus('validation-lambda', 'success');
    updateEdgeStatus('e-validation-choice', { targetNodeStatus: 'success' });
    
    // validation-choiceからdata-fix-lambdaへの遷移
    updateNodeStatus('validation-choice', 'success');
    updateEdgeStatus('e-choice-fix', { targetNodeStatus: 'progress' });
    updateNodeStatus('data-fix-lambda', 'progress');
  };

  const updateWorkflowState = (nodeId: WorkflowNodeId, status: string) => {
    // validation-failed の特別処理
    if (nodeId === 'validation-lambda' && status === 'validation-failed') {
      handleValidationFailed();
      return;
    }

    // 並列ノードかどうかをチェック
    const isParallelNode = PARALLEL_NODES.includes(nodeId);

    // 並列ノード以外の場合は順序をチェック
    if (!isParallelNode) {
      const nodeIndex = workflowSequence.indexOf(nodeId);
      if (nodeIndex === -1) return;
    }

    // ノードの状態を更新
    updateNodeStatus(nodeId, status as StateType);

    edges.forEach(edge => {
      const source = edge.source as WorkflowNodeId;
      const target = edge.target as WorkflowNodeId;

      // 現在のノードに関連するエッジの更新
      if (source === nodeId || target === nodeId) {
        if (target === nodeId) {
          updateEdgeStatus(edge.id, { targetNodeStatus: status as StateType });
        }

        // 成功時の次のノードの更新
        if (status === 'success' && source === nodeId) {
          // 並列ノードの場合
          if (isParallelNode && target === 'pdf-format-lambda') {
            // すべての並列ノードが完了しているか確認
            const allParallelNodesCompleted = PARALLEL_NODES.every(parallelNode => 
              nodes.find(n => n.id === parallelNode)?.data?.status === 'success'
            );
            if (allParallelNodesCompleted) {
              updateNodeStatus('pdf-format-lambda', 'progress');
              updateEdgeStatus(edge.id, { targetNodeStatus: 'progress' });
            }
          } 
          // callback-queueから並列ノードへの遷移
          else if (source === 'callback-success-lambda' && PARALLEL_NODES.includes(target)) {
            updateNodeStatus(target, 'progress');
            updateEdgeStatus(edge.id, { targetNodeStatus: 'progress' });
          }
          // 通常のフロー
          else if (!isParallelNode) {
            const nextNode = edge.target as WorkflowNodeId;
            const currentNodeState = nodes.find(n => n.id === nextNode)?.data?.status;
            if (currentNodeState === 'ready') {
              updateNodeStatus(nextNode, 'progress');
              updateEdgeStatus(edge.id, { targetNodeStatus: 'progress' });
            }
          }
        }
      }
    });
  };

  const initializeFirstStep = () => {
    updateNodeStatus('api-gateway', 'progress');
    updateEdgeStatus('e-start-api', { targetNodeStatus: 'progress' });
  };

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  useEffect(() => {
    if (!workflowId || !sessionId) return;

    if (!isWorkflowOwner(sessionId, workflowId)) {
      return;
    }

    setConnectionStatus('connecting');
    const eventSource = new EventSource(`/api/sse/${workflowId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ProgressData;
        console.log('Received SSE data:', data);

        if ('progress' in data) {
          setConnectionStatus('connected');
          initializeFirstStep();
          return;
        }

        updateWorkflowState(data.state_name, data.status);

        updateNodeData(data.state_name, {
          timestamp: data.timestamp,
          logs: data.logs,
          metrics: data.metrics
        });

        if (data.status === 'success' && data.state_name === 'end') {
          setConnectionStatus('completed');
        } else if (data.status === 'failed') {
          setConnectionStatus('error');
        }
      } catch (error) {
        console.error('Error processing SSE message:', error);
        setConnectionStatus('error');
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      setConnectionStatus('error');
      eventSource.close();
    };

    return () => {
      console.log('Closing SSE connection for workflow:', workflowId);
      eventSource.close();
      setConnectionStatus('disconnected');
    };
  }, [workflowId, sessionId, updateNodeStatus, updateNodeData, updateEdgeStatus, isWorkflowOwner]);

  return { connectionStatus };
};