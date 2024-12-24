'use server'

import { DynamoDB } from 'aws-sdk';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { WorkflowHistory } from '@/features/workflow/types/types';
import { CloudWatchLogs } from 'aws-sdk';
import { LogGroupResults, LogGroupRequestIds, QueryResults, LogEntry, CloudWatchQueryResult } from '@/features/workflow/types/types';

const dynamodb = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

const cloudWatchLogs = new CloudWatchLogs({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

// カテゴリ取得
export async function getCategories() {
  try {
    const result = await dynamodb.scan({
      TableName: process.env.CATEGORIES_TABLE_NAME!,
      ConsistentRead: true
    }).promise();

    const categories = result.Items?.map(item => ({
        category_type_en: item.category_type_en,
        category_type_jp: item.category_type_jp
      })) || [];

    return categories;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

// 履歴取得
export async function getWorkflowHistories() {
  try {
    const result = await dynamodb.scan({
      TableName: process.env.WORKFLOW_HISTORIES_TABLE_NAME!,
      ConsistentRead: true,
      Limit: 10,
    }).promise();

    return result.Items as WorkflowHistory[];
  } catch (error) {
    console.error('Failed to fetch workflow histories:', error);
    return [];
  }
}

// 履歴作成
export async function createWorkflowHistory(data: {
  workflow_id: string;
  title: string;
  category: string;
  timestamp: string;
}) {
  try {
    const item = {
      ...data,
      status: 'processing'
    };

    await dynamodb.put({
      TableName: process.env.WORKFLOW_HISTORIES_TABLE_NAME!,
      Item: item
    }).promise();

    revalidatePath('/');
    return item;
  } catch (error) {
    console.error('Failed to create workflow history:', error);
    throw new Error('Failed to create history');
  }
}

// ステータス更新
export async function updateWorkflowStatus(workflowId: string, status: 'processing' | 'completed' | 'error') {
  try {
    await dynamodb.update({
      TableName: process.env.WORKFLOW_HISTORIES_TABLE_NAME!,
      Key: { workflow_id: workflowId },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status
      }
    }).promise();

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to update workflow status:', error);
    throw new Error('Failed to update status');
  }
}

// ワクフローの進捗状況を取得
export async function getWorkflowProgress(workflowId: string) {
  try {
    const result = await dynamodb.query({
      TableName: process.env.WORKFLOW_PROGRESS_MANAGEMENT_TABLE_NAME!,
      KeyConditionExpression: 'workflow_id = :workflowId',
      ExpressionAttributeValues: {
        ':workflowId': workflowId
      }
    }).promise();

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    return result.Items
      .map(item => {
        
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
            order: parseInt(order),
            status: item.status
          };
        } catch (error) {
          console.error('Error processing item:', item, error);
          return null;
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.order - b.order);

  } catch (error) {
    console.error('Failed to fetch workflow progress:', error);
    return [];
  }
}

// キャッシュされたログ取得関数
export const startAndWaitLogQueries = unstable_cache(
  async (
    workflowId: string,
    logGroupRequests: LogGroupRequestIds,
    timestamp: string
  ): Promise<LogGroupResults> => {
    try {
      const workflowStartTime = new Date(timestamp).getTime();
      console.log('Fetching logs for workflow:', workflowId);

      // クエリを開始
      const startedQueries = await Promise.all(
        Object.entries(logGroupRequests).map(async ([logGroupName, requestId]) => {
          const query = await cloudWatchLogs.startQuery({
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
          }).promise();

          return {
            logGroupName,
            queryId: query.queryId!,
            requestId
          };
        })
      );

      console.log('Started queries for workflow:', workflowId, startedQueries);

      // 結果を格納するオブジェクト
      const allLogs: LogGroupResults = {};
      const pendingQueries = new Set(startedQueries.map(q => q.logGroupName));

      // クエリの完了を監視し、完了したものからログを取得
      while (pendingQueries.size > 0) {
        await Promise.all(
          Array.from(pendingQueries).map(async (logGroupName) => {
            const query = startedQueries.find(q => q.logGroupName === logGroupName)!;
            
            try {
              const result = await cloudWatchLogs.getQueryResults({
                queryId: query.queryId
              }).promise() as CloudWatchQueryResult;

              if (result.status === 'Complete') {
                console.log('Query results:', {
                  logGroupName,
                  status: result.status,
                  resultsCount: result.results?.length,
                  firstResult: result.results?.[0]
                });

                if (result.results?.[0]) {
                  // 結果から各フィールドの値を取得
                  const logStream = result.results[0].find(r => r.field === 'logStream')?.value;
                  const startTime = result.results[0].find(r => r.field === 'startTime')?.value;
                  const endTime = result.results[0].find(r => r.field === 'endTime')?.value;

                  if (logStream && startTime && endTime) {
                    const queryResult: QueryResults = {
                      logGroupName,
                      queryId: query.queryId,
                      logStream,
                      startTime: Number(startTime),
                      endTime: Number(endTime)
                    };

                    // ログを取得して直接格納
                    allLogs[logGroupName] = await getWorkflowLogs(queryResult);
                    console.log(`Completed logs for ${logGroupName}`);
                  } else {
                    console.log(`Missing required fields for ${logGroupName}`, { logStream, startTime, endTime });
                  }
                } else {
                  console.log(`No logs found for ${logGroupName}`);
                }
                pendingQueries.delete(logGroupName);
              }

              if (result.status === 'Failed' || result.status === 'Cancelled' || result.status === 'Timeout') {
                console.error(`Query failed for ${logGroupName} with status: ${result.status}`);
                pendingQueries.delete(logGroupName);
              }
            } catch (error) {
              console.error(`Error processing ${logGroupName}:`, error);
              pendingQueries.delete(logGroupName);
            }
          })
        );

        if (pendingQueries.size > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return allLogs;

    } catch (error) {
      console.error('Failed to execute log queries:', error);
      throw error instanceof Error ? error : new Error('Failed to execute log queries');
    }
  },
  ['workflow-logs'],  // タグ
  {
    revalidate: 60 * 60 * 24,  // 24時間キャッシュ
    tags: ['workflow-logs']     // キャッシュの無効化に使用できるタグ
  }
);

// 個別のログ取得関数
export async function getWorkflowLogs(queryResult: QueryResults): Promise<LogEntry[]> {
  try {
    const { logGroupName, logStream, startTime, endTime } = queryResult;

    // パラメータのログ出力を追加
    console.log('Fetching logs with params:', {
      logGroupName,
      logStream,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString()
    });

    // logStreamが存在することを確認
    if (!logStream) {
      console.error('LogStream is empty');
      return [];
    }

    const logs = await cloudWatchLogs.filterLogEvents({
      logGroupName,
      logStreamNames: [logStream],
      startTime,
      endTime,
      limit: 100
    }).promise();

    return (logs.events || []).map(event => ({
      timestamp: new Date(event.timestamp!).toISOString(),
      ingestionTime: new Date(event.ingestionTime!).toISOString(),
      message: event.message!
    }));

  } catch (error) {
    console.error('Failed to fetch workflow logs:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch workflow logs');
  }
}

// キャッシュを無効化する関数
export async function invalidateWorkflowLogs() {
  revalidateTag('workflow-logs');
} 