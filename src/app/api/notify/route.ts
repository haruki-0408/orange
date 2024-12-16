import { broadcastToWorkflow } from "@/lib/sse/SSEManager";
import { NextRequest, NextResponse } from 'next/server';


export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { workflow_id, progress } = json;

    if (!workflow_id || !progress) {
      console.warn('Missing workflow_id or progress in request');
      return NextResponse.json({ error: 'Missing workflow_id or progress' }, { status: 400 });
    }

    console.log('Broadcasting progress:', { workflow_id, progress });
    broadcastToWorkflow(workflow_id, { progress });

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Error in /api/notify:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
