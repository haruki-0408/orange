import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { WorkflowStatusType, WorkflowHistory, ActiveWorkflow } from '../types/types';


interface WorkflowState {
  activeWorkflows: Map<string, ActiveWorkflow>;
  generateWorkflowId: () => string;
  getActiveWorkflowStatus: (workflowId: string) => WorkflowStatusType | undefined;
  addWorkflow: (workflowId: string, title: string, category: string) => string | null;
  removeWorkflow: (workflowId: string) => void;
  getActiveWorkflowBySession: (sessionId: string) => ActiveWorkflow | undefined;
  hasActiveWorkflow: (sessionId: string) => boolean;
  isActiveWorkflow: (workflowId: string) => boolean;
  generateSessionId: () => string;
  selectedWorkflow: WorkflowHistory | ActiveWorkflow | null;
  setSelectedWorkflow: (workflow: WorkflowHistory | ActiveWorkflow | null) => void;
}

const SESSION_STORAGE_KEY = 'workflow_session_id';
const WORKFLOW_STORAGE_KEY = 'active_workflows';

export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    (set, get) => ({
      sessionId: '',
      activeWorkflows: (() => {
        if (typeof window === 'undefined') return new Map();
        const stored = sessionStorage.getItem(WORKFLOW_STORAGE_KEY);
        return stored ? new Map(JSON.parse(stored)) : new Map();
      })(),

      generateSessionId: () => {
        if (typeof window === 'undefined') return '';
        
        // 既存のセッションIDを確認
        let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!sessionId) {
          sessionId = uuidv4();
          sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
        }
        return sessionId;
      },

      // 8文字の小文字英数字を生成する関数
      generateWorkflowId: () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from(crypto.getRandomValues(new Uint8Array(8)))
          .map(n => chars[n % chars.length])
          .join('');
      },

      addWorkflow: (workflowId, title, category) => {
        const sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!sessionId) return null;

        const state = get();
        if (state.hasActiveWorkflow(sessionId)) {
          return null;
        }

        const timestamp = new Date().toISOString();

        set((state) => {
          const newWorkflows = new Map(state.activeWorkflows);
          const newWorkflow: ActiveWorkflow = {
            workflow_id: workflowId,
            session_id: sessionId,
            title: title,
            category: category,
            timestamp: timestamp,
            status: 'PROCESSING' as WorkflowStatusType
          };
          newWorkflows.set(workflowId, newWorkflow);
          sessionStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify([...newWorkflows]));
          return { activeWorkflows: newWorkflows };
        });

        return workflowId;
      },

      removeWorkflow: (workflowId) => {
        set((state) => {
          const newWorkflows = new Map(state.activeWorkflows);
          newWorkflows.delete(workflowId);
          sessionStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify([...newWorkflows]));
          return { activeWorkflows: newWorkflows };
        });
      },

      getActiveWorkflowBySession: (sessionId) => {
        const { activeWorkflows } = get();
        set
        return Array.from(activeWorkflows.values())
          .find(workflow => workflow.session_id === sessionId);
      },

      getActiveWorkflowStatus: (workflowId: string) => {
        const { activeWorkflows } = get();
        return activeWorkflows.get(workflowId)?.status;
      },

      hasActiveWorkflow: (sessionId) => {
        const { activeWorkflows } = get();
        return Array.from(activeWorkflows.values())
          .some(workflow => workflow.session_id === sessionId);
      },

      isActiveWorkflow: (workflowId: string) => {
        const workflow = get().activeWorkflows.get(workflowId);
        return workflow?.status === 'PROCESSING';
      },

      selectedWorkflow: null,
      setSelectedWorkflow: (workflow) => set({ selectedWorkflow: workflow }),

    }),
    { name: 'workflow-store' }
  )
); 