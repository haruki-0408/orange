// import { broadcastToWorkflow } from "@/lib/sse/SSEClient";
import SSEClient from "@/lib/sse/SSEClient";
import { ProgressData } from "@/features/workflow/types/types";
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { workflow_id } = json;

    if (!workflow_id) {
      console.warn('Missing workflow_id in request');
      return NextResponse.json({ error: 'Missing workflow_id' }, { status: 400 });
    }

    // state_name#timestampを分割
    const [timestamp, order] = json['timestamp#order'].split('#');
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

    const progress: ProgressData = {
      execution_id: json.execution_id,
      status: json.status,
      order: parseInt(order),
      state_name: json.state_name,
      timestamp: formattedTimestamp
    }

    SSEClient.broadcastToWorkflow(workflow_id, progress);

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Error in /api/notify:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
