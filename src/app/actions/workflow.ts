"use server"
import { revalidatePath } from 'next/cache';
import { WorkflowHistory } from '@/features/workflow/types/types';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { CloudWatchLogsClient, StartQueryCommand, GetQueryResultsCommand, FilterLogEventsCommand, FilteredLogEvent } from '@aws-sdk/client-cloudwatch-logs';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import {
  getSignedUrl,
} from "@aws-sdk/s3-request-presigner";
import { XRayClient, BatchGetTracesCommand, Trace } from '@aws-sdk/client-xray';
import { awsCredentialsProvider } from '@vercel/functions/oidc';
import { 
  LogGroupResults,  
  Category,
  PresignedUrlResponse,
  WorkflowProgressItem,
  WorkflowProgressRawItem,
  LogGroupRequests, 
  QueryResults, 
  LogEntry, 
  WorkflowStatusType,
  StartWorkflowResponse,
} from '@/features/workflow/types/types';
import { maskAccountId } from '@/utils/other';

const AWS_REGION = process.env.AWS_REGION!;

// 開発環境のみ
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID!;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!;

// 本番環境のみ
const AWS_ROLE_ARN = process.env.AWS_ROLE_ARN!;

// 認証情報の設定
const credentials = process.env.NODE_ENV === 'production' && AWS_ROLE_ARN
  ? awsCredentialsProvider({ roleArn: AWS_ROLE_ARN })
  : {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY
    };

const s3client = new S3Client({
  region: AWS_REGION,
  credentials: credentials
});

const dynamodb = new DynamoDBClient({
  region: AWS_REGION,
  credentials: credentials
});

const docClient = DynamoDBDocumentClient.from(dynamodb);

const cloudWatchLogs = new CloudWatchLogsClient({
  region: AWS_REGION,
  credentials: credentials
});

const xrayClient = new XRayClient({
  region: process.env.AWS_REGION,
  credentials: credentials
});

/**
 * カテゴリ一覧を取得
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: process.env.WORKFLOW_CATEGORIES_TABLE_NAME!,
      ConsistentRead: true
    }));

    const items = result.Items as Category[];
    return items.map((item: Category) => ({
      category_type_en: item.category_type_en,
      category_type_jp: item.category_type_jp
    })) || [];
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

/**
 * ワークフローを開始
 */
export async function startWorkflow(
  workflowId: string,
  title: string,
  category: string
): Promise<StartWorkflowResponse> {
  try {
    // ダブルクォートをエスケープ
    const sanitizedTitle = title.replace(/"/g, '"');

    const body = {
      workflow_id: workflowId,
      title: sanitizedTitle,
      category: category
    };

    const response = await fetch(`${process.env.APIGATEWAY_URL}/workflow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.APIGATEWAY_API_KEY!
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Failed to start workflow:', error);
    throw new Error('Failed to start workflow');
  }
}

/**
 * ワークフロー履歴一覧を取得
 */
export async function getWorkflowHistories(): Promise<WorkflowHistory[]> {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: process.env.WORKFLOW_HISTORIES_TABLE_NAME!,
      ConsistentRead: true,
      Limit: 30
    }));

    return (result.Items as WorkflowHistory[])
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('Failed to fetch workflow histories:', error);
    return [];
  }
}

/**
 * ワークフロー履歴を作成
 */
export async function createWorkflowHistory(data: {
  workflow_id: string;
  title: string;
  category: string;
  timestamp: string;
  status: WorkflowStatusType;
}): Promise<{
  workflow_id: string;
  title: string;
  category: string;
  timestamp: string;
  status: WorkflowStatusType;
}> {
  try {
    const item = { ...data, status: data.status };
    await docClient.send(new PutCommand({
      TableName: process.env.WORKFLOW_HISTORIES_TABLE_NAME!,
      Item: item
    }));

    revalidatePath('/');
    return item;
  } catch (error) {
    console.error('Failed to create workflow history:', error);
    throw new Error('Failed to create history');
  }
}

/**
 * ワークフローの進捗状況を取得
 */
export async function getWorkflowProgress(
  workflowId: string
): Promise<WorkflowProgressItem[]> {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.WORKFLOW_PROGRESS_MANAGEMENT_TABLE_NAME!,
      KeyConditionExpression: 'workflow_id = :workflowId',
      ExpressionAttributeValues: { ':workflowId': workflowId },
      ScanIndexForward: true
    }));

    if (!result.Items?.length) return [];

    const items = result.Items as WorkflowProgressRawItem[];
    
    return items
      .map((item: WorkflowProgressRawItem) => {
        try {
          const [timestamp, order] = item['timestamp#order'].split('#');
          // JST形式に変換
          const jstDate = new Date(timestamp);
          const formattedTimestamp = jstDate.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }).replace(/\//g, '-');

          return {
            workflow_id: item.workflow_id,
            state_name: item.state_name,
            timestamp: formattedTimestamp,
            request_id: item.request_id,
            order: parseInt(order),
            status: item.status
          };
        } catch (error) {
          console.error('Error processing item:', item, error);
          return null;
        }
      })
      .filter((item): item is WorkflowProgressItem => item !== null);
  } catch (error) {
    console.error('Failed to fetch workflow progress:', error);
    return [];
  }
}

/**
 * CloudWatch Logsのクエリを開始し、結果を待機
 */
export async function startAndWaitLogQueries(
  logGroupRequests: LogGroupRequests,
  timestamp: string
): Promise<LogGroupResults> {
  try {
    const workflowStartTime = new Date(timestamp).getTime();

    // 各リクエストIDのクエリを開始
    const startedQueries = await Promise.all(
      Object.entries(logGroupRequests).map(async ([requestId, logGroupName]) => {
        const query = await cloudWatchLogs.send(new StartQueryCommand({
          logGroupName,
          startTime: workflowStartTime,
          endTime: Date.now(),
          queryString: `
            fields @timestamp, @logStream
            | filter @requestId = '${requestId}'
            | stats earliest(@logStream) as logStream,
                    latest(@timestamp) as endTime,
                    earliest(@timestamp) as startTime
          `
        }));

        return { requestId, logGroupName, queryId: query.queryId! };
      })
    );

    // クエリの完了を監視し結果を収集
    const allLogs: LogGroupResults = {};
    const pendingQueries = new Set(startedQueries.map(q => q.requestId));

    while (pendingQueries.size > 0) {
      await Promise.all(
        Array.from(pendingQueries).map(async (requestId) => {
          const query = startedQueries.find(q => q.requestId === requestId)!;
          
          try {
            const result = await cloudWatchLogs.send(new GetQueryResultsCommand({
              queryId: query.queryId
            }));

            if (result.status === 'Complete') {
              console.log('Query results:', {
                requestId,
                status: result.status,
                resultsCount: result.results?.length,
                firstResult: result.results?.[0]
              });

              if (result.results?.[0]) {
                // 各フィールドの値を取得
                const logStream = result.results[0].find(r => r.field === 'logStream')?.value;
                const startTime = result.results[0].find(r => r.field === 'startTime')?.value;
                const endTime = result.results[0].find(r => r.field === 'endTime')?.value;

                if (logStream && startTime && endTime) {
                  const queryResult: QueryResults = {
                    requestId: requestId,
                    logGroupName: query.logGroupName,
                    queryId: query.queryId,
                    logStream,
                    startTime: Number(startTime),
                    endTime: Number(endTime)
                  };

                  // requestIdをキーとしてログを格納
                  allLogs[requestId] = await getWorkflowLogs(queryResult);
                }
              }
              pendingQueries.delete(requestId);
            }

            // エラー状態の確認
            if (result.status === 'Failed' || result.status === 'Cancelled' || result.status === 'Timeout') {
              pendingQueries.delete(requestId);
            }
          } catch (error) {
            console.error(`Error processing ${requestId}:`, error);
            pendingQueries.delete(requestId);
          }
        })
      );

      // 待機中のクエリがある場合は1秒待機
      if (pendingQueries.size > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return allLogs;
  } catch (error) {
    console.error('Failed to execute log queries:', error);
    throw error instanceof Error ? error : new Error('ログクエリの実行に失敗しました');
  }
}

/**
 * 特定のワークフローログを取得
 */
export async function getWorkflowLogs(
  queryResult: QueryResults
): Promise<LogEntry[]> {
  try {
    const { logGroupName, logStream, startTime, endTime } = queryResult;

    if (!logStream) {
      console.error('LogStream is empty');
      return [];
    }

    const logs = await cloudWatchLogs.send(new FilterLogEventsCommand({
      logGroupName,
      logStreamNames: [logStream],
      startTime,
      endTime,
      limit: 100
    }));

    return (logs.events || []).map((event: FilteredLogEvent) => ({
      timestamp: new Date(event.timestamp!).toISOString(),
      ingestionTime: new Date(event.ingestionTime!).toISOString(),
      message: maskAccountId(event.message!)
    }));
  } catch (error) {
    console.error('Failed to fetch workflow logs:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch workflow logs');
  }
}

/**
 * ワークフローログのキャッシュを無効化
 */
// export async function invalidateWorkflowLogs(): Promise<void> {
//   revalidateTag('workflow-logs');
// }

/**
 * S3の署名付きURLを生成
 */
export async function generatePresignedUrl(
  workflowId: string
): Promise<PresignedUrlResponse> {
  try {
    const expiresIn = 60 * 5;
    const command = new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: `${workflowId}/fake_thesis.pdf` });
    const url = await getSignedUrl(s3client, command, { expiresIn: expiresIn });

    if (!url) throw new Error('Failed to generate presigned URL');

    return {
      url: url,
      expires: new Date(Date.now() + expiresIn * 1000).toISOString() // 有効期限
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    if (error instanceof Error && error.name === 'NoSuchKey') {
      throw new Error('PDF file not found');
    }
    throw new Error('Failed to generate download URL');
  }
}

/**
 * X-Rayのトレース情報を取得
 */
export async function getXRayTraces(
  traceIds: string[]
): Promise<Trace[]> {
  try {
    const command = new BatchGetTracesCommand({ TraceIds: traceIds });
    const response = await xrayClient.send(command);

    if (!response.Traces) throw new Error('No traces found');

    return response.Traces;
  } catch (error) {
    console.error('Failed to get X-Ray traces:', error);
    throw error instanceof Error ? error : new Error('X-Rayトレースの取得に失敗しました');
  }
}
