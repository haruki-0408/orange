import { addClient, removeClient } from "@/lib/sse/SSEManager";
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { workflow_id: string } }) {
  const { workflow_id } = params;

  const stream = new ReadableStream({
    start(controller) {
      addClient(workflow_id, controller);

      req.signal.addEventListener('abort', () => {
        removeClient(workflow_id, controller);
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
