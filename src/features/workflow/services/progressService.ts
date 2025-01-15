import { 
  ProgressbarType,
} from '../types/types';
import { Node } from "@xyflow/react";
import { getWorkflowProgress } from '@/app/actions/workflow';
export const progressService = {
  /**
   * ワークフロー進行状況の取得
   */
  async fetchWorkflowProgress(workflowId: string) {
    const workflowProgress = await getWorkflowProgress(workflowId);
    return workflowProgress;
  },

    /**
   * プログレスバーの更新計算
   */
  calculateProgress(nodes: Node[]): { percentage: number; status: ProgressbarType['status'] } {
    const failedNodes = nodes.filter(node => node.data.status === 'failed').length;
    const completedNodes = nodes.filter(
      node => node.data.status === 'success' && node.id !== 'data-fix-lambda'
    ).length;

    const totalNodes = 11;
    const percentage = Math.round((completedNodes / totalNodes) * 100);
    const status = failedNodes > 0 ? 'FAILED' : percentage === 100 ? 'SUCCESS' : 'PROCESSING';

    return { percentage, status };
  },
};