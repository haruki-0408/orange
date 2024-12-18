import { create } from 'zustand';
import { Node, Edge } from 'reactflow';
import { initialNodes } from '../const/initialNodes';
import { initialEdges } from '../const/initialEdges';
import { NodeStatusType, NodeData } from '../types/types';

interface FlowState {
  nodes: Node<NodeData>[];
  edges: Edge[];
  updateNodeStatus: (nodeId: string, status: NodeStatusType) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
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
      )
    }));
  },

  updateNodeData: (nodeId, newData) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    }));
  },

  resetFlow: () => {
    set({ nodes: initialNodes, edges: initialEdges });
  }
})); 