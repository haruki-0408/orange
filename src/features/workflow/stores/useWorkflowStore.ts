import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type ActiveWorkflow = {
  workflowId: string;
  sessionId: string;
  title: string;
  category: string;
  timestamp: string;
};

interface WorkflowState {
  activeWorkflows: Map<string, ActiveWorkflow>;
  addWorkflow: (sessionId: string, workflow: Omit<ActiveWorkflow, 'sessionId'>) => void;
  removeWorkflow: (workflowId: string) => void;
  getWorkflowBySession: (sessionId: string) => ActiveWorkflow | undefined;
  isWorkflowOwner: (sessionId: string, workflowId: string) => boolean;
}

export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    (set, get) => ({
      activeWorkflows: new Map(),

      addWorkflow: (sessionId, workflow) => {
        set((state) => {
          const newWorkflows = new Map(state.activeWorkflows);
          newWorkflows.set(workflow.workflowId, {
            ...workflow,
            sessionId
          });
          return { activeWorkflows: newWorkflows };
        });
      },

      removeWorkflow: (workflowId) => {
        set((state) => {
          const newWorkflows = new Map(state.activeWorkflows);
          newWorkflows.delete(workflowId);
          return { activeWorkflows: newWorkflows };
        });
      },

      getWorkflowBySession: (sessionId) => {
        const { activeWorkflows } = get();
        return Array.from(activeWorkflows.values())
          .find(workflow => workflow.sessionId === sessionId);
      },

      isWorkflowOwner: (sessionId, workflowId) => {
        const { activeWorkflows } = get();
        const workflow = activeWorkflows.get(workflowId);
        return workflow?.sessionId === sessionId;
      }
    }),
    { name: 'workflow-store' }
  )
); 