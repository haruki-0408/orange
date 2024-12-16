interface ErrorData {
  id: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  service: string;
  details: string;
}

export const mockErrorData: ErrorData[] = [
  {
    id: 'err-001',
    level: 'error',
    message: 'Failed to generate thesis content',
    timestamp: '2024-03-14T10:00:01.782Z',
    service: 'Lambda',
    details: 'Memory limit exceeded in content generation'
  },
  {
    id: 'err-002',
    level: 'warning',
    message: 'High latency detected',
    timestamp: '2024-03-14T10:00:02.123Z',
    service: 'API Gateway',
    details: 'Request processing took longer than expected'
  },
  {
    id: 'err-003',
    level: 'info',
    message: 'Auto-scaling event triggered',
    timestamp: '2024-03-14T10:00:02.445Z',
    service: 'Lambda',
    details: 'Function concurrency increased'
  }
]; 