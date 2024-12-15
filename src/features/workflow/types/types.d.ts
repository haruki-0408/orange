type ServiceType = 'Lambda' | 'SQS' | 'APIGateway' | 'DynamoDB' | 'S3';
type StatusType = 'ready' | 'success' | 'failed' | 'progress' | 'stopped';

interface ServiceDetails {
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