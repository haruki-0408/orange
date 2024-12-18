import { create } from 'zustand';
import { Node, Edge } from 'reactflow';
import { initialNodes } from '../const/initialNodes';
import { initialEdges } from '../const/initialEdges';
import { StateType, NodeData } from '../types/types';

interface EdgeData {
  targetNodeStatus: StateType;
}

interface FlowState {
  nodes: Node<NodeData>[];
  edges: Edge[];
  updateNodeStatus: (nodeId: string, status: StateType) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  updateEdgeStatus: (edgeId: string, data: EdgeData) => void;
  resetFlow: () => void;
}

export const useFlowStore = create<FlowState>((set) => ({
  nodes: initialNodes,
  edges: initialEdges,

  updateNodeStatus: (nodeId, status) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, status } }
          : node
      ),
    }));
  },

  updateNodeData: (nodeId, newData) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      ),
    }));
  },

  updateEdgeStatus: (edgeId, data) => {
    set((state) => ({
      edges: state.edges.map((edge) =>
        edge.id === edgeId
          ? {
              ...edge,
              data: { 
                ...edge.data,
                targetNodeStatus: data.targetNodeStatus 
              }
            }
          : edge
      ),
    }));
  },

  resetFlow: () => {
    set({ nodes: initialNodes, edges: initialEdges });
  },
}));

// エッジの色を状態に応じて設定
const getEdgeColor = (status: StateType): string => {
  switch (status) {
    case 'progress':
      return '#06b6d4';
    case 'success':
      return '#22c55e';
    case 'failed':
      return '#ef4444';
    default:
      return '#94a3b8';
  }
}; 