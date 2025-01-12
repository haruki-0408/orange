import { 
  TimelineTraceData, 
  TraceMetricsData,
  WorkflowProgressItem,
  LogData,
  TraceIds,
} from '../types/types';
import { Trace, Segment } from '@aws-sdk/client-xray';
import { getXRayTraces } from '@/app/actions/workflow';

export const traceService = {
  /**
   * ログデータからトレースIDを抽出
   */
  getTraceIds(logData: LogData[]): TraceIds {
    const defaultTraceIds: TraceIds = {
      mainTraceId: null,
      subTraceId: null
    };

    if (!logData || logData.length === 0) {
      return defaultTraceIds;
    }

    // format-lambdaのログからmainTraceIdを検索
    const formatLambdaLog = logData.find(log => log.stateName === 'format-lambda');
    const mainTraceId = formatLambdaLog?.logEntries
      .find(entry => entry.message.includes('XRAY TraceId:'))
      ?.message.match(/XRAY TraceId: (1-[a-f0-9]{8}-[a-f0-9]{24})/)?.[1] || null;

    // ai-request-lambdaのログからsubTraceIdを検索
    const aiRequestLambdaLog = logData.find(log => log.stateName === 'ai-request-lambda');
    const subTraceId = aiRequestLambdaLog?.logEntries
      .find(entry => entry.message.includes('XRAY TraceId:'))
      ?.message.match(/XRAY TraceId: (1-[a-f0-9]{8}-[a-f0-9]{24})/)?.[1] || null;

    return {
      mainTraceId: mainTraceId ?? null,
      subTraceId: subTraceId ?? null
    };
  },

  /**
   * X-Rayトレースの取得
   */
  async fetchTraces(traceIds: TraceIds) {
    if (!traceIds.mainTraceId) {
      throw new Error('No trace IDs provided');
    }

    const allTraceIds = [traceIds.mainTraceId, traceIds.subTraceId].filter(Boolean) as string[];
    const result = await getXRayTraces(allTraceIds);
    
    return result;
  },

  /**
   * タイムラインデータの生成
   */
  processTimelineData(
    workflowProgress: WorkflowProgressItem[],
    traces: Trace[],
    traceIds: TraceIds,
    logData: LogData[]
  ): TimelineTraceData[] {
    return workflowProgress.map(progress => {
      // API Gateway の場合の特別処理
      if (progress.state_name === 'api-gateway') {
        // API Gatewayのセグメントを検索
        const apiGatewaySegment = traces.flatMap(trace => trace.Segments || [])
          .find(segment => {
            try {
              const doc = JSON.parse(segment.Document || '{}');
              return doc.name === 'API Gateway' || doc.origin === 'AWS::ApiGateway::Stage';
            } catch (e) {
              console.error('Failed to parse API Gateway segment document:', e);
              return false;
            }
          });

        let duration = 0;
        if (apiGatewaySegment) {
          try {
            const doc = JSON.parse(apiGatewaySegment.Document || '{}');
            const startTime = doc.start_time;
            const endTime = doc.end_time;
            if (startTime && endTime) {
              duration = Math.round((endTime - startTime) * 1000);
            }
          } catch (e) {
            console.error('Failed to parse API Gateway segment duration:', e);
          }
        }

        return {
          state_name: progress.state_name,
          duration,
          start_at: new Date(progress.timestamp).toLocaleTimeString('ja-JP'),
          request_id: progress.request_id,
          memory_size: null,
          memory_used: null,
          is_cold_start: null
        };
      }

      // callback-queue の場合の特別処理
      if (progress.state_name === 'callback-queue') {
        const mainTrace = traces.find(trace => trace.Id === traceIds.mainTraceId);
        let duration = 0;

        if (mainTrace?.Segments) {
          const sqsSegment = mainTrace.Segments.find(segment => {
            try {
              const doc = JSON.parse(segment.Document || '{}');
              return doc.name === 'SQS';
            } catch (e) {
              console.error('Failed to parse SQS segment document:', e);
              return false;
            }
          });

          if (sqsSegment) {
            try {
              const doc = JSON.parse(sqsSegment.Document || '{}');
              const startTime = doc.start_time;
              const endTime = doc.end_time;
              if (startTime && endTime) {
                duration = Math.round((endTime - startTime) * 1000);
              }
            } catch (e) {
              console.error('Failed to parse SQS segment duration:', e);
            }
          }
        }

        return {
          state_name: progress.state_name,
          duration,
          start_at: new Date(progress.timestamp).toLocaleTimeString('ja-JP'),
          request_id: null,
          memory_size: null,
          memory_used: null,
          is_cold_start: null
        };
      }

      // その他のLambda関数の処理
      const matchingLog = logData.find(log => 
        log.logEntries.some(entry => entry.message.includes(progress.request_id ?? ''))
      );

      // Duration計算用のLambdaセグメント検索
      const lambdaSegment = traces.flatMap(trace => trace.Segments || [])
        .find(segment => {
          try {
            const doc = JSON.parse(segment.Document || '{}');
            return doc.aws?.request_id === progress.request_id &&
                   doc.origin === 'AWS::Lambda';
          } catch (e) {
            console.error('Failed to parse Lambda segment document:', e);
            return false;
          }
        });

      let duration = 0;
      if (lambdaSegment) {
        try {
          const doc = JSON.parse(lambdaSegment.Document || '{}');
          const startTime = doc.start_time;
          const endTime = doc.end_time;
          if (startTime && endTime) {
            duration = Math.round((endTime - startTime) * 1000);
          }
        } catch (e) {
          console.error('Failed to parse Lambda duration:', e);
        }
      }

      // コールドスタート判定用のセグメント検索
      let isColdStart = false;
      const functionSegment = traces.flatMap(trace => trace.Segments || [])
        .find(segment => {
          try {
            const doc = JSON.parse(segment.Document || '{}');
            return doc.origin === 'AWS::Lambda::Function' && 
                   doc.aws?.cloudwatch_logs?.[0]?.log_group === matchingLog?.logGroupName;
          } catch (e) {
            console.error('Failed to parse function segment document:', e);
            return false;
          }
        });

      if (functionSegment) {
        try {
          const doc = JSON.parse(functionSegment.Document || '{}');
          const handlerSubsegment = doc.subsegments?.find(
            (subsegment: any) => subsegment?.name === '## lambda_handler'
          );
          
          if (handlerSubsegment?.annotations?.ColdStart === true) {
            isColdStart = true;
          }
        } catch (e) {
          console.error('Failed to parse cold start data:', e);
        }
      }

      const reportEntry = matchingLog?.logEntries.find(entry => 
        entry.message.startsWith('REPORT RequestId: ' + progress.request_id)
      );

      let memorySize = null;
      let memoryUsed = null;

      if (reportEntry) {
        const memoryMatch = reportEntry.message.match(/Memory Size: (\d+) MB/);
        const usedMemoryMatch = reportEntry.message.match(/Max Memory Used: (\d+) MB/);
        
        if (memoryMatch) memorySize = parseInt(memoryMatch[1], 10);
        if (usedMemoryMatch) memoryUsed = parseInt(usedMemoryMatch[1], 10);
      }

      return {
        state_name: progress.state_name,
        duration,
        start_at: new Date(progress.timestamp).toLocaleTimeString('ja-JP'),
        request_id: progress.request_id,
        memory_size: memorySize,
        memory_used: memoryUsed,
        is_cold_start: isColdStart
      };
    });
  },

  /**
   * メトリクスデータの計算
   */
  processMetricsData(timelines: TimelineTraceData[], traces: Trace[]): TraceMetricsData {
    const latencies = timelines.map(item => item.duration).sort((a, b) => a - b);
    const memories = timelines
      .filter(item => typeof item.memory_used === 'number')
      .map(item => item.memory_used as number);
    
    const p95Index = Math.floor(latencies.length * 0.95);

    const dynamoDBMetrics = {
      totalReadCount: 0,
      totalWriteCount: 0,
      totalReadTime: 0,
      totalWriteTime: 0,
      averageReadTime: 0,
      averageWriteTime: 0
    };

    const s3Metrics = {
      totalReadCount: 0,
      totalWriteCount: 0,
      totalReadTime: 0,
      totalWriteTime: 0,
      averageReadTime: 0,
      averageWriteTime: 0
    };

    traces.forEach(trace => {
      trace.Segments?.forEach(segment => {
        try {
          const doc = JSON.parse(segment.Document || '{}');
          if (doc.name === 'DynamoDB' && doc.origin === 'AWS::DynamoDB::Table') {
            const operation = doc.aws?.operation;
            const duration = Math.round((doc.end_time - doc.start_time) * 1000);

            if (operation === 'GetItem') {
              dynamoDBMetrics.totalReadCount++;
              dynamoDBMetrics.totalReadTime += duration;
            } else if (operation === 'PutItem') {
              dynamoDBMetrics.totalWriteCount++;
              dynamoDBMetrics.totalWriteTime += duration;
            }
          } else if (doc.name === 'S3') {
            const operation = doc.aws?.operation;
            const duration = Math.round((doc.end_time - doc.start_time) * 1000);

            if (operation === 'GetObject') {
              s3Metrics.totalReadCount++;
              s3Metrics.totalReadTime += duration;
            } else if (operation === 'PutObject') {
              s3Metrics.totalWriteCount++;
              s3Metrics.totalWriteTime += duration;
            }
          }
        } catch (e) {
          console.error('Failed to parse segment document:', e);
        }
      });
    });

    // 平均値の計算
    if (dynamoDBMetrics.totalReadCount > 0) {
      dynamoDBMetrics.averageReadTime = Math.round(dynamoDBMetrics.totalReadTime / dynamoDBMetrics.totalReadCount);
    }
    if (dynamoDBMetrics.totalWriteCount > 0) {
      dynamoDBMetrics.averageWriteTime = Math.round(dynamoDBMetrics.totalWriteTime / dynamoDBMetrics.totalWriteCount);
    }
    if (s3Metrics.totalReadCount > 0) {
      s3Metrics.averageReadTime = Math.round(s3Metrics.totalReadTime / s3Metrics.totalReadCount);
    }
    if (s3Metrics.totalWriteCount > 0) {
      s3Metrics.averageWriteTime = Math.round(s3Metrics.totalWriteTime / s3Metrics.totalWriteCount);
    }

    return {
      averageLatency: latencies.length 
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 0,
      p95Latency: latencies[p95Index] || 0,
      lambdaAverageMemory: memories.length 
        ? Math.round(memories.reduce((a, b) => a + b, 0) / memories.length)
        : 0,
      maxMemory: memories.length ? Math.max(...memories) : 0,
      lambdaInvocations: timelines.filter(item => 
        !['api-gateway', 'callback-queue'].includes(item.state_name)
      ).length,
      coldStarts: timelines.filter(item => item.is_cold_start).length,
      dynamoDB: dynamoDBMetrics,
      s3: s3Metrics
    };
  },

  /**
   * 実行時間のフォーマット（X-RayのDurationは秒単位で返却される）
   */
  formatExecutionTime(durationInSeconds: number): string {
    // 秒単位の値を分と秒に変換
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    const milliseconds = Math.round((durationInSeconds % 1) * 1000);

    if (minutes > 0) {
      return `${minutes}m${seconds}s`;
    }
    return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
  },

  /**
   * トレースデータの処理とデバッグ出力
   */
  processTraceData(
    workflowProgress: WorkflowProgressItem[],
    traces: Trace[] | undefined,
    traceIds: TraceIds,
    logData: LogData[]
  ) {
    if (!traces) return {
      timelines: [],
      metrics: {
        averageLatency: 0,
        p95Latency: 0,
        lambdaAverageMemory: 0,
        maxMemory: 0,
        lambdaInvocations: 0,
        coldStarts: 0,
        dynamoDB: {
          totalReadCount: 0,
          totalWriteCount: 0,
          totalReadTime: 0,
          totalWriteTime: 0,
          averageReadTime: 0,
          averageWriteTime: 0
        },
        s3: {
          totalReadCount: 0,
          totalWriteCount: 0,
          totalReadTime: 0,
          totalWriteTime: 0,
          averageReadTime: 0,
          averageWriteTime: 0
        }
      },
      executionTime: ''
    };

    // タイムラインデータの生成
    const timelines = this.processTimelineData(
      workflowProgress,
      traces,
      traceIds,
      logData
    );

    // メトリクスデータの計算
    const metrics = this.processMetricsData(timelines, traces);

    // メインワークフローの実行時間を計算
    const mainTrace = traces.find(trace => trace.Id === traceIds.mainTraceId);
    const executionTime = mainTrace?.Duration 
      ? this.formatExecutionTime(mainTrace.Duration)
      : '';

    // デバッグ用のログ出力
    // if (process.env.NODE_ENV === 'development') {
    //   this.outputDebugLogs({
    //     timelines,
    //     metrics,
    //     executionTime,
    //     traces,
    //     traceIds: traceIds as { mainTraceId: string; subTraceId: string }
    //   });
    // }

    return { timelines, metrics, executionTime };
  },

  /**
   * デバッグログの出力
   */
  outputDebugLogs(data: {
    timelines: TimelineTraceData[];
    metrics: TraceMetricsData;
    executionTime: string;
    traces: Trace[];
    traceIds: { mainTraceId: string; subTraceId: string };
  }) {
    console.log('Timeline Data:', data.timelines);
    console.log('Metrics Data:', data.metrics);
    console.log('Execution Time:', data.executionTime);
    console.log('X-Ray Trace Data:', {
      mainTrace: data.traces.find(trace => trace.Id === data.traceIds.mainTraceId),
      subTrace: data.traces.find(trace => trace.Id === data.traceIds.subTraceId)
    });
  },

}; 