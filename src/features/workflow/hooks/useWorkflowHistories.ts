import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkflowHistory } from '../types/types.d';

const QUERY_KEY = 'workflowHistories';

type WorkflowStatus = 'processing' | 'completed' | 'error';

interface CreateHistoryInput {
  workflow_id: string;
  title: string;
  category: string;
}

interface UpdateStatusInput {
  workflowId: string;
  status: WorkflowStatus;
}

export const useWorkflowHistories = () => {
  const queryClient = useQueryClient();

  const { data: histories = [], isLoading } = useQuery<WorkflowHistory[]>({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const response = await fetch('/api/workflow/histories');
      if (!response.ok) throw new Error('Failed to fetch histories');
      return response.json();
    },
    staleTime: 1000 * 30, // 30秒間はキャッシュを新鮮と見なす
  });

  const createHistory = useMutation<WorkflowHistory, Error, CreateHistoryInput>({
    mutationFn: async (data) => {
      const response = await fetch('/api/workflow/histories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create history');
      return response.json();
    },
    onSuccess: (newHistory) => {
      queryClient.setQueryData<WorkflowHistory[]>(
        [QUERY_KEY], 
        (old = []) => [newHistory, ...old]
      );
    },
  });

  const updateStatus = useMutation<
    { workflowId: string; status: WorkflowStatus }, 
    Error, 
    UpdateStatusInput
  >({
    mutationFn: async ({ workflowId, status }) => {
      const response = await fetch(`/api/workflow/${workflowId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return { workflowId, status };
    },
    onSuccess: ({ workflowId, status }) => {
      queryClient.setQueryData<WorkflowHistory[]>(
        [QUERY_KEY], 
        (old = []) => old.map(h => 
          h.workflow_id === workflowId 
            ? { ...h, status } 
            : h
        )
      );
    },
  });

  return {
    histories,
    isLoading,
    createHistory,
    updateStatus,
  };
}; 