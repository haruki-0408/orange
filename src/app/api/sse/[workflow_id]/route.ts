import { NextRequest } from 'next/server';

interface SSEClient {
  workflowId: string;
  controller: ReadableStreamDefaultController;
}

let clients: SSEClient[] = []; // モジュールスコープで定義

export async function GET(req: NextRequest, { params }: { params: { workflow_id: string } }) {
  const { workflow_id } = params;

  console.log(`New SSE connection for workflow_id: ${workflow_id}`);

  const stream = new ReadableStream({
    start(controller) {
      const client: SSEClient = { workflowId: workflow_id, controller };
      clients.push(client);

      console.log('Client connected:', client);
      console.log('Current clients:', clients);

      req.signal.addEventListener('abort', () => {
        console.log('Client disconnected:', client);
        clients = clients.filter((c) => c.workflowId !== workflow_id || c.controller !== controller);
        console.log('Remaining clients:', clients);
      });

    //   controller.enqueue(new TextEncoder().encode(`event: connected;\ndata: Connected to workflow ${workflow_id};\n\n`));
    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ progress: `Connected workflow_id : ${workflow_id}`, workflowId: workflow_id })}\n\n`));
    // 　console.log(`Connection confirmation message sent to workflow_id: ${workflow_id}`);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Content-Encoding': "none",
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

export function broadcastToWorkflow(workflowId: string, data: any) {
  console.log('Broadcasting to workflowId:', workflowId);

  const matchedClients = clients.filter(
    (client) => client.workflowId.trim() === workflowId.trim()
  );

  console.log('Matched clients:', matchedClients);

  if (matchedClients.length === 0) {
    console.warn(`No clients found for workflowId: ${workflowId}`);
    return;
  }

　//   const message = `event: progress\ndata: ${JSON.stringify(data)}\n\n`;
　const message = `data: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(message);

  matchedClients.forEach((client) => {
    console.log('Sending message to client:', client.workflowId);
    client.controller.enqueue(encoded);
  });
}
