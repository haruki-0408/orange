import { TraceMetricsData } from "../types/types";

export const mockMetricsData: TraceMetricsData = {
  "averageLatency": 9412,
  "p95Latency": 80616,
  "lambdaAverageMemory": 154,
  "maxMemory": 218,
  "lambdaInvocations": 9,
  "coldStarts": 9,
  "dynamoDB": {
      "totalReadCount": 1,
      "totalWriteCount": 10,
      "totalReadTime": 318,
      "totalWriteTime": 3080,
      "averageReadTime": 318,
      "averageWriteTime": 308
  },
  "s3": {
      "totalReadCount": 10,
      "totalWriteCount": 11,
      "totalReadTime": 489,
      "totalWriteTime": 1177,
      "averageReadTime": 49,
      "averageWriteTime": 107
  }
};