export type ServiceType = 'Lambda' | 'SQS' | 'APIGateway' | 'DynamoDB' | 'S3';
export type StatusType = 'ready' | 'success' | 'failed' | 'progress' | 'stopped';

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

export interface MetricData {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change?: number;
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