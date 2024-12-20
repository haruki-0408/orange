import React, { useCallback } from "react";
import ReactFlow, {
  NodeTypes,
  EdgeTypes,
  Controls,
  useNodesState,
  useEdgesState,
  MiniMap,
  Background,
  BackgroundVariant,
  useReactFlow,
  useNodes,
  useEdges
} from "reactflow";
import { initialNodes } from "../../const/initialNodes";
import { initialEdges } from "../../const/initialEdges";
import { useWorkflowProgress } from "../../hooks/useWorkflowProgress";
import { useTheme } from "../../contexts/ThemeContext";
import styles from "./style.module.scss";
import { CustomNode } from "../CustomNode";
import { MainWorkflowGroup } from "../MainWorkflowGroup";
import { SubWorkflowGroup } from "../SubWorkflowGroup";
import { ChoiceNode } from "../ChoiceNode";
import { TerminalNode } from "../TerminalNode";
import { SupportingServicesGroup } from "../SupportingServicesGroup";
import { CustomEdge } from "../CustomEdge";
import { useSSEStore } from '../../stores/useSSEStore';

interface Props {
  workflowId: string | null;
  onNodeClick: (nodeId: string) => void;
  selectedNodeId: string | null;
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
  mainGroup: MainWorkflowGroup,
  subGroup: SubWorkflowGroup,
  choice: ChoiceNode,
  terminal: TerminalNode,
  supportingGroup: SupportingServicesGroup
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge
};

export const StepFunctionVisualizer: React.FC<Props> = ({
  workflowId,
  onNodeClick,
  selectedNodeId,
}) => {
  const { theme } = useTheme();
  const [nodes] = useNodesState(initialNodes);
  const [edges] = useEdgesState(initialEdges);

  // SSEによる進捗監視
  
  useWorkflowProgress(workflowId);

  return (
    <div className={styles.visualizer}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => onNodeClick(node.id)}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        panOnDrag={true}
        zoomOnScroll={true}
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: true,
          maxZoom: 1
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
      >
        <Controls
          showInteractive={false}
          className={styles.controls}
          color={theme === "dark" ? "#06b6d4" : "#2563eb"}
        />
        <MiniMap
          style={{
            backgroundColor: theme === "dark" ? "rgba(13, 13, 15, 0.98)" : "#ffffff",
            border: theme === "dark" ? "1px solid rgba(6, 182, 212, 0.15)" : "1px solid rgba(37, 99, 235, 0.1)",
            borderRadius: "8px",
            boxShadow: theme === "dark" ? "0 4px 20px rgba(0, 0, 0, 0.2)" : "0 4px 20px rgba(0, 0, 0, 0.05)"
          }}
          className={styles.minimap}
          maskColor={theme === "dark" ? "rgba(6, 182, 212, 0.08)" : "rgba(37, 99, 235, 0.05)"}
          nodeColor={(n) => {
            if (n.id === selectedNodeId) {
              return theme === "dark" ? "#06b6d4" : "#2563eb";
            }
            return theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(37, 99, 235, 0.1)";
          }}
        />
        <Background
          gap={20}
          size={1}
          color={theme === "dark" ? "rgba(0, 0, 0, 0.2)" : "#2563eb0d"}
          className={styles.background}
          variant={BackgroundVariant.Lines}
        />
      </ReactFlow>
    </div>
  );
};
