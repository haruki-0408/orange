// import { addClient, removeClient } from "@/lib/sse/SSEClient";
import SSEClient from "@/lib/sse/SSEClient";
import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = "force-dynamic"
// export const maxDuration = 60;

export async function GET(req: NextRequest, { params }: { params: { workflow_id: string } }) {
  const { workflow_id } = params;

  const stream = new ReadableStream({
    start(controller) {
      SSEClient.addClient(workflow_id, controller);

      req.signal.addEventListener('abort', () => {
        SSEClient.removeClient(workflow_id, controller);
      });

      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ progress: `Connected workflow_id : ${workflow_id}`, workflowId: workflow_id })}\n\n`));
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
