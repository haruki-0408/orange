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
  serviceType: string;
  details: {
    requestId?: string;
    resourceName?: string;
    errorMessage?: string;
    memoryUsed?: number;
    coldStart?: boolean;
  };
  subsegments?: TraceData[];
} 