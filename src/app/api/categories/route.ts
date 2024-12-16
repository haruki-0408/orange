import { NextResponse } from 'next/server';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDB({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

const docClient = DynamoDBDocument.from(client);

export async function GET() {
  try {
    const params = {
      TableName: process.env.CATEGORIES_TABLE_NAME!,
      ProjectionExpression: 'category_type_en, category_type_jp'
    };

    const result = await docClient.scan(params);
    const categories = result.Items?.map(item => ({
      category_type_en: item.category_type_en,
      category_type_jp: item.category_type_jp
    })) || [];

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { message: 'Error fetching categories' },
      { status: 500 }
    );
  }
} 