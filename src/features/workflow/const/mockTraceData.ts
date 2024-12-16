import { TraceData } from '../types/types';

export const mockTraceData: TraceData[] = [
  {
    id: 'api-gateway',
    name: 'API Request',
    duration: 120,
    startTime: '2024-03-14T10:00:00.000Z',
    status: 'success',
    serviceType: 'APIGateway',
    details: {
      requestId: 'req-001',
      resourceName: '/api/v1/thesis'
    }
  },
  {
    id: 'format-lambda',
    name: 'Format Retrieval',
    duration: 245,
    startTime: '2024-03-14T10:00:00.120Z',
    status: 'success',
    serviceType: 'Lambda',
    details: {
      requestId: 'req-002',
      resourceName: 'get-thesis-format',
      memoryUsed: 128,
      coldStart: true
    }
  },
  {
    id: 'prompt-lambda',
    name: 'Prompt Generation',
    duration: 890,
    startTime: '2024-03-14T10:00:00.365Z',
    status: 'success',
    serviceType: 'Lambda',
    details: {
      requestId: 'req-003',
      resourceName: 'generate-prompt',
      memoryUsed: 256,
      coldStart: false
    }
  }
]; 