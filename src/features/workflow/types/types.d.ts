/**
 * 基本的なステータス・サービス型定義
 */
export type ServiceType = 'Lambda' | 'SQS' | 'APIGateway' | 'DynamoDB' | 'S3';
export type StateType = 'ready' | 'progress' | 'success' | 'failed' | 'stopped' | 'validation-failed';
export type WorkflowStatusType = 'PROCESSING' | 'SUCCESS' | 'FAILED';
export type ConnectionStatus = 'CONNECTING' | 'LIVE' | 'ERROR' | null;
export type NotifyStatus = 'success' | 'failed';

/**
 * ワークフローノードに関する型定義
 */
export type WorkflowNodeId = 
  | 'start'           // 開始ノード
  | 'api-gateway'     // API Gatewayノード
  | 'format-lambda'   // 入力フォーマット処理
  | 'prompt-lambda'   // プロンプト生成
  | 'callback-queue'  // コールバックキュー
  | 'ai-request-lambda'      // AI生成処理
  | 'validation-lambda'      // 検証処理
  | 'data-fix-lambda'        // データ修正
  | 'callback-success-lambda'       // コールバック成功
  | 'formula-gen-lambda'     // 数式生成
  | 'table-gen-lambda'       // 表生成
  | 'graph-gen-lambda'       // グラフ生成
  | 'pdf-format-lambda'      // PDF整形
  | 'end';            // 終了ノード

/**
 * UI表示に関する型定義
 */
export interface ProgressbarType {
  percentage: number;
  status: WorkflowStatusType;
}

export interface EdgeData {
  targetNodeStatus: StateType;
  animated?: boolean;
}

export interface WorkflowNode {
  id: string;
  type: string;
  status: StateType;
  data: NodeData;
  position?: {
    x: number;
    y: number;
  };
}

export interface NodeData {
  label: string;
  status: StateType;
  timestamp?: string;
  service?: ServiceType;
  details?: ServiceDetails[keyof ServiceDetails];
}

/**
 * AWSサービス詳細設定に関する型定義
 */
export interface ServiceDetails {
  Lambda: {
    functionName: string;
    memory: number;
    timeout: number;
    runtime: string;
  };
  DynamoDB: {
    tableName: string;
    primaryKey: string;
    readCapacity: number;
    writeCapacity: number;
    indexes?: string[];
  };
  SQS: {
    queueName: string;
    messageRetention: number;
    visibilityTimeout: number;
    delaySeconds: number;
  };
  APIGateway: {
    endpoint: string;
    method: string;
    stage: string;
    authType: string;
  };
  S3: {
    bucketName: string;
    versioning: boolean;
    encryption: string;
    accessControl: string;
  };
}

/**
 * ワークフロー進捗・履歴に関する型定義
 */
export interface ProgressData {
  execution_id: string;
  status: NotifyStatus;
  order: number;
  state_name: WorkflowNodeId;
  timestamp: string;
}

export interface WorkflowProgressItem {
  workflow_id: string;
  state_name: WorkflowNodeId;
  timestamp: string;
  request_id: string;
  order: number;
  status: string;
}

export interface ActiveWorkflow {
  workflow_id: string;
  session_id: string;  
  title: string;
  category: string;
  timestamp: string;
  status: WorkflowStatusType;
}

export interface WorkflowHistory {
  workflow_id: string;
  title: string;
  category: string;
  timestamp: string;
  status: WorkflowStatusType;
}

export interface WorkflowData {
  workflow_id: string;
  timestamp: string;
  trace_ids: {
    mainTraceId: string;
    subTraceId: string;
  };
}

export interface StartWorkflowResponse {
  workflow_id: string;
  execution_arn: string;
  start_date: string;
  status: WorkflowStatusType;
}

/**
 * ログ関連の型定義
 */
export interface LogData {
  id: string;
  level: 'error' | 'warning' | 'info';
  timestamp: string;
  stateName: string;
  logGroupName: string;
  service: string;
  logEntries: LogEntry[];
}

export interface LogEntry {
  timestamp: string;
  ingestionTime: string;
  message: string;
}

export interface LogGroupRequests {
  [requestId: string]: string;  // key: requestId, value: logGroupName
}

export interface QueryResults {
  requestId: string;
  logGroupName: string;
  queryId: string;
  logStream: string;
  startTime: number;
  endTime: number;
}

export interface LogGroupResults {
  [requestId: string]: LogEntry[];
}

export interface LogStatus {
  current: number;
  expected: number;
}

export interface CloudWatchQueryResult {
  results?: {
    field: string;
    value: string;
  }[][];
  status: 'Complete' | 'Failed' | 'Running' | 'Cancelled' | 'Timeout' | 'Unknown';
}

/**
 * トレースとメトリクスに関する型定義
 */
export interface TraceIds {
  mainTraceId: string | null;
  subTraceId: string | null;
}

export interface TraceData {
  id: string;
  name: string;
  duration: number;
  startTime: string;
  status: 'success' | 'error' | 'throttle' | 'fault';
  serviceType: ServiceType;
  details: {
    requestId?: string;
    resourceName?: string;
    errorMessage?: string;
    memoryUsed?: number;
    coldStart?: boolean;
  };
  subsegments?: TraceData[];
}

export interface TimelineTraceData {
  state_name: string;
  duration: number;      // 実行時間(ms)
  memory_size?: number | null;  // 設定されたメモリ(MB)
  memory_used?: number | null;  // 使用されたメモリ(MB)
  start_at: string;      // 開始時間
  is_cold_start?: boolean | null;
  request_id: string | null; // SQSの場合はnullを許容
}

export interface TraceMetricsData {
  averageLatency: number;
  p95Latency: number;
  lambdaAverageMemory: number;
  maxMemory: number;
  lambdaInvocations: number;
  coldStarts: number;
  dynamoDB: {
    totalReadCount: number;
    totalWriteCount: number;
    totalReadTime: number;
    totalWriteTime: number;
    averageReadTime: number;
    averageWriteTime: number;
  };
  s3: {
    totalReadCount: number;
    totalWriteCount: number;
    totalReadTime: number;
    totalWriteTime: number;
    averageReadTime: number;
    averageWriteTime: number;
  };
}

export interface WorkflowTraceResult {
  timelines: TimelineTraceData[];
  metrics: TraceMetricsData;
  executionTime: string;
  isLoading: boolean;
  error: Error | null;
}

export interface MetricsData {
  summary: {
    totalDuration: number;
    totalServices: number;
    estimatedCost: number;
    successRate: number;
  };
  performance: {
    latency: MetricData[];
    memory: MetricData[];
    coldStarts: {
      total: number;
      percentage: number;
      trend: 'up' | 'down' | 'stable';
      change: number;
    };
  };
  resources: {
    lambda: {
      invocations: number;
      errors: number;
      throttles: number;
      duration: {
        average: number;
        p95: number;
      };
    };
    apiGateway: {
      requests: number;
      errors: number;
      latency: {
        average: number;
        p95: number;
      };
    };
    dynamoDB: {
      readCapacity: {
        consumed: number;
        provisioned: number;
      };
      writeCapacity: {
        consumed: number;
        provisioned: number;
      };
    };
  };
}

/**
 * その他の型定義
 */
export interface Category {
  category_type_en: string;
  category_type_jp: string;
}

export interface PresignedUrlResponse {
  url: string;
  expires: string;
}