export type ServiceType = 'Lambda' | 'SQS' | 'APIGateway' | 'DynamoDB' | 'S3';
export type StateType = 'ready' | 'progress' | 'success' | 'failed' | 'stopped' | 'validation-failed';
export type WorkflowStatusType = 'PROCESSING' | 'SUCCESS' | 'FAILED';
export type ConnectionStatus = 'CONNECTING' | 'LIVE' | 'ERROR' | null;

export interface ProgressbarType {
  percentage: number;
  status: WorkflowStatusType;
}

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

export type NotifyStatus = 'success' | 'failed';

export interface ProgressData {
  execution_id: string;
  status: NotifyStatus;
  order: number;
  state_name: WorkflowNodeId;
  timestamp: string;
  // metrics?: {
  //   duration?: number;
  //   memory?: number;
  //   [key: string]: any;
  // };
}

export interface LogData {
  id: string;
  level: 'error' | 'warning' | 'info';
  timestamp: string;
  stateName: string;
  logGroupName: string;
  service: string;
  logEntries: LogEntry[];
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

export interface Category {
  category_type_en: string;
  category_type_jp: string;
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

export interface ActiveWorkflow {
  workflow_id: string;
  session_id: string;  
  title: string;
  category: string;
  timestamp: string;
  status: WorkflowStatusType;
};

export interface WorkflowHistory {
  workflow_id: string;
  title: string;
  category: string;
  timestamp: string;
  status: WorkflowStatusType;
}

export interface WorkflowNode {
  id: string;
  type: string;
  status: NodeStatus;
  data: Record<string, any>;
}

export interface NodeData {
  label: string;
  status: StateType;
  metrics?: {
    duration?: number;
    memory?: number;
    [key: string]: any;
  };
  timestamp?: string;
} 

export interface CloudWatchQueryResult {
  results?: {
    field: string;
    value: string;
  }[][];
  status: 'Complete' | 'Failed' | 'Running' | 'Cancelled' | 'Timeout' | 'Unknown';
}

export interface LogEntry {
  timestamp: string;
  ingestionTime: string;
  message: string;
}

export interface LogGroupRequestIds {
  [logGroupName: string]: string;  // key: logGroupName, value: requestId
}

export interface QueryResults {
  logGroupName: string;
  queryId: string;
  logStream: string;
  startTime: number;
  endTime: number;
}

export interface LogGroupResults {
  [logGroupName: string]: LogEntry[];
}