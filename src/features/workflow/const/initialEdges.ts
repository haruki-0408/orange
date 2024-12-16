import { Edge } from 'reactflow';

export const initialEdges: Edge[] = [
  // メインフロー
  {
    id: "e-start-api",
    source: "start",
    target: "api-gateway",
    type: "custom",
    sourceHandle: "source-bottom",
    targetHandle: "target-top",
    data: { targetNodeStatus: "success" }
  },
  {
    id: "e-api-format",
    source: "api-gateway",
    target: "format-lambda",
    type: "custom",
    sourceHandle: "source-bottom",
    targetHandle: "target-top",
    data: { targetNodeStatus: "ready" }
  },
  {
    id: "e-format-prompt",
    source: "format-lambda",
    target: "prompt-lambda",
    type: "custom",
    sourceHandle: "source-bottom",
    targetHandle: "target-top",
    data: { targetNodeStatus: "ready" }
  },
  {
    id: "e-prompt-callback",
    source: "prompt-lambda",
    target: "callback-queue",
    type: "custom",
    sourceHandle: "source-bottom",
    targetHandle: "target-top",
    data: { targetNodeStatus: "ready" }
  },
  // サブワークフロー内のフロー
  {
    id: "e-callback-ai",
    source: "callback-queue",
    target: "ai-request-lambda",
    type: "custom",
    sourceHandle: "source-right",
    targetHandle: "target-left",
    data: { targetNodeStatus: "ready" }
  },
  {
    id: "e-ai-validation",
    source: "ai-request-lambda",
    target: "validation-lambda",
    type: "custom",
    sourceHandle: "source-bottom",
    targetHandle: "target-top",
    data: { targetNodeStatus: "ready" }
  },
  {
    id: "e-validation-choice",
    source: "validation-lambda",
    target: "validation-choice",
    type: "custom",
    sourceHandle: "source-bottom",
    targetHandle: "target-top",
    data: { targetNodeStatus: "ready" }
  },
  {
    id: "e-choice-success",
    source: "validation-choice",
    target: "callback-success",
    type: "custom",
    sourceHandle: "source-bottom",
    targetHandle: "target-top",
    data: { targetNodeStatus: "success" }
  },
  {
    id: "e-choice-fix",
    source: "validation-choice",
    target: "data-fix",
    type: "custom",
    sourceHandle: "source-right",
    targetHandle: "target-left",
    data: { targetNodeStatus: "ready" }
  },
  {
    id: "e-fix-validation",
    source: "data-fix",
    target: "validation-lambda",
    type: "custom",
    sourceHandle: "source-right",
    targetHandle: "target-right",
    data: { targetNodeStatus: "ready" }
  },
  // パラレル処理のフロー
  {
    id: "e-callback-formula",
    source: "callback-queue",
    target: "formula-gen",
    type: "custom",
    sourceHandle: "source-bottom",
    targetHandle: "target-top",
    data: { targetNodeStatus: "ready" }
  },
  {
    id: "e-callback-table",
    source: "callback-queue",
    target: "table-gen",
    type: "custom",
    sourceHandle: "source-bottom",
    targetHandle: "target-top",
    data: { targetNodeStatus: "ready" }
  },
  {
    id: "e-callback-graph",
    source: "callback-queue",
    target: "graph-gen",
    type: "custom",
    sourceHandle: "source-bottom",
    targetHandle: "target-top",
    data: { targetNodeStatus: "ready" }
  },
  // PDF生成フロー
  {
    id: "e-formula-pdf",
    source: "formula-gen",
    target: "pdf-format",
    type: "custom",
    sourceHandle: "source-bottom",
    targetHandle: "target-top",
    data: { targetNodeStatus: "ready" }
  },
  {
    id: "e-table-pdf",
    source: "table-gen",
    target: "pdf-format",
    type: "custom",
    sourceHandle: "source-bottom",
    targetHandle: "target-top",
    data: { targetNodeStatus: "ready" }
  },
  {
    id: "e-graph-pdf",
    source: "graph-gen",
    target: "pdf-format",
    type: "custom",
    sourceHandle: "source-bottom",
    targetHandle: "target-top",
    data: { targetNodeStatus: "ready" }
  },
  // S3保存フロー
  {
    id: "e-pdf-s3",
    source: "pdf-format",
    target: "thesis-bucket",
    type: "custom",
    sourceHandle: "source-right",
    targetHandle: "target-left",
    data: { targetNodeStatus: "ready" }
  },
  // 終了フロー
  {
    id: "e-s3-end",
    source: "thesis-bucket",
    target: "end",
    type: "custom",
    sourceHandle: "source-bottom",
    targetHandle: "target-top",
    data: { targetNodeStatus: "ready" }
  }
];
