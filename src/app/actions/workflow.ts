'use server'

import { DynamoDB } from 'aws-sdk';
import { revalidatePath } from 'next/cache';
import { WorkflowHistory } from '@/features/workflow/types/types';

const dynamodb = new DynamoDB.DocumentClient({
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

// ワークフローの進捗状況を取得
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