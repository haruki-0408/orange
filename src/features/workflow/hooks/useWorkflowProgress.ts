import { useEffect, useState } from 'react';
import { useWorkflowStore } from '../stores/useWorkflowStore';
import { useFlowStore } from '../stores/useFlowStore';
import { ProgressData, NodeStatusType } from '../types/types';
import { getSessionId } from '../../../utils/session';

export const useWorkflowProgress = (workflowId: string | null) => {
  const { isWorkflowOwner } = useWorkflowStore();
  const { updateNodeStatus, updateNodeData } = useFlowStore();
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  useEffect(() => {
    if (!workflowId || !sessionId) return;

    const eventSource = new EventSource(`/api/sse/${workflowId}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as ProgressData;
      
      const nodeId = getNodeIdFromStateName(data.state_name);
      if (!nodeId) return;

      updateNodeStatus(nodeId, mapStatusToNodeStatus(data.status));

      if (data.logs || data.metrics) {
        updateNodeData(nodeId, {
          logs: data.logs,
          metrics: data.metrics,
          timestamp: data.timestamp
        });
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };

    return () => eventSource.close();
  }, [workflowId, sessionId, updateNodeStatus, updateNodeData, isWorkflowOwner]);
};

const getNodeIdFromStateName = (stateName: string): string | undefined => {
  const stateToNodeMap: Record<string, string> = {
    'GenerateOutline': 'node-1',
    'GenerateContent': 'node-2',
    'GenerateImages': 'node-3',
    'CompilePDF': 'node-4',
  };
  return stateToNodeMap[stateName];
};

const mapStatusToNodeStatus = (status: ProgressData['status']): NodeStatusType => {
  switch (status) {
    case 'RUNNING':
      return 'progress';
    case 'SUCCEEDED':
      return 'success';
    case 'FAILED':
      return 'failed';
    default:
      return 'ready';
  }
}; 