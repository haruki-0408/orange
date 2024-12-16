interface MetricData {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change?: number;
}

export const mockMetricsData = {
  summary: {
    totalDuration: 2450,
    totalServices: 8,
    estimatedCost: 0.0023,
    successRate: 98.5
  },
  performance: {
    latency: [
      {
        id: 'lat-001',
        name: 'Average Latency',
        value: 245,
        unit: 'ms',
        trend: 'down',
        change: 12.5
      },
      {
        id: 'lat-002',
        name: 'P95 Latency',
        value: 890,
        unit: 'ms',
        trend: 'up',
        change: 5.2
      }
    ],
    memory: [
      {
        id: 'mem-001',
        name: 'Average Memory',
        value: 256,
        unit: 'MB',
        trend: 'stable'
      },
      {
        id: 'mem-002',
        name: 'Max Memory',
        value: 512,
        unit: 'MB',
        trend: 'stable'
      }
    ],
    coldStarts: {
      total: 3,
      percentage: 15,
      trend: 'down',
      change: 8.3
    }
  },
  resources: {
    lambda: {
      invocations: 12,
      errors: 1,
      throttles: 0,
      duration: {
        average: 245,
        p95: 890
      }
    },
    apiGateway: {
      requests: 8,
      errors: 0,
      latency: {
        average: 120,
        p95: 350
      }
    },
    dynamoDB: {
      readCapacity: {
        consumed: 45.5,
        provisioned: 100
      },
      writeCapacity: {
        consumed: 22.3,
        provisioned: 50
      }
    }
  }
}; 