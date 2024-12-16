import { broadcastToWorkflow } from "@/lib/sse/SSEManager";
import { executionAsyncId } from "async_hooks";
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
    const [stateName, timestamp] = json['state_name#timestamp'].split('#');
    
    const progress = {
      execution_id: json.execution_id,
      status: json.status,
      state_name: stateName,
      timestamp: timestamp
    }

    broadcastToWorkflow(workflow_id, progress);

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Error in /api/notify:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
