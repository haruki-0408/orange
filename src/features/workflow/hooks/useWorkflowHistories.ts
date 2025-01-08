import { useState } from 'react';
import { createWorkflowHistory, getWorkflowHistories } from '@/app/actions/workflow';
import { WorkflowHistory, WorkflowStatusType } from '@/features/workflow/types/types';

interface WorkflowHistoriesProps {
  initialHistories: WorkflowHistory[];
}

export const useWorkflowHistories = ({
  initialHistories,
}: WorkflowHistoriesProps) => {
  const [histories, setHistories] = useState<WorkflowHistory[]>(initialHistories);
  const [workflowHistoriesLoading, setWorkflowHistoriesLoading] = useState(false);

  const handleUpdate = async (workflow: WorkflowHistory, status: WorkflowStatusType) => {
    try {
      // 履歴追加
      setHistories((prev: WorkflowHistory[]) => prev.map((h: WorkflowHistory) => 
        h.workflow_id === workflow.workflow_id ? { ...h, status: status as WorkflowStatusType } : h
      ));

      // DynamoDB更新
      await createWorkflowHistory({
        workflow_id: workflow.workflow_id,
        title: workflow.title,
        category: workflow.category,
        timestamp: workflow.timestamp,
        status: status as WorkflowStatusType
      });
      
    } catch (error) {
      // エラー時は状態を戻す
      setHistories((prev: WorkflowHistory[]) => prev.map((h: WorkflowHistory) => 
        h.workflow_id === workflow.workflow_id ? { ...h, status: h.status } : h
      ));
      throw error;
    }
  };

  const refetchHistories = async () => {
    setWorkflowHistoriesLoading(true);
    try {
      const latest = await getWorkflowHistories();
      setHistories(latest);
    } catch (error) {
      console.error('Failed to fetch histories:', error);
      throw error;
    } finally {
      setWorkflowHistoriesLoading(false);
    }
  };

  return {
    histories, // 履歴一覧
    setHistories, // 履歴の更新(DB更新を伴わない)
    handleUpdate, // 履歴の更新(DB更新を伴う)
    refetchHistories, // 履歴の再取得
    workflowHistoriesLoading // ローディング中かどうか
  };
};
