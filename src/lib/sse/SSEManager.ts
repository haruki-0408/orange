interface SSEClient {
  workflowId: string;
  controller: ReadableStreamDefaultController;
}

const clients: SSEClient[] = [];

// クライアントを追加
export function addClient(workflowId: string, controller: ReadableStreamDefaultController) {
  clients.push({ workflowId, controller });
}

// クライアントを削除
export function removeClient(workflowId: string, controller: ReadableStreamDefaultController) {
  const index = clients.findIndex(
    (client) => client.workflowId === workflowId && client.controller === controller
  );
  if (index !== -1) {
    clients.splice(index, 1);
  }
}

// 指定されたworkflowIdのクライアントにデータを送信
export function broadcastToWorkflow(workflowId: string, data: any) {
  console.log("Broadcasting to workflowId:", workflowId);

  const matchedClients = clients.filter((client) => client.workflowId.trim() === workflowId.trim());

  console.log("Matched clients:", matchedClients);

  if (matchedClients.length === 0) {
    console.warn(`No clients found for workflowId: ${workflowId}`);
    return;
  }

  const message = `data: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(message);

  matchedClients.forEach((client) => {
    console.log("Sending message to client:", client.workflowId);
    client.controller.enqueue(encoded);
  });
}
