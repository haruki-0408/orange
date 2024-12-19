import { ProgressData } from "@/features/workflow/types/types";

interface SSEClient {
  workflowId: string;
  controller: ReadableStreamDefaultController;
}

// シローバルな型定義
declare global {
  var __sse_clients: Map<string, SSEClient[]>;
}

// グローバルなクライアント管理用のMap
if (!global.__sse_clients) {
  global.__sse_clients = new Map<string, SSEClient[]>();
}

// クライアントを追加
export function addClient(workflowId: string, controller: ReadableStreamDefaultController): void {
  const currentClients = global.__sse_clients.get(workflowId) || [];
  currentClients.push({ workflowId, controller });
  global.__sse_clients.set(workflowId, currentClients);
  console.log(`Client added for workflow: ${workflowId}, Total clients: ${currentClients.length}`);
}

// クライアントを削除
export function removeClient(workflowId: string, controller: ReadableStreamDefaultController): void {
  const currentClients = global.__sse_clients.get(workflowId);
  if (!currentClients) return;

  const updatedClients = currentClients.filter(client => client.controller !== controller);
  if (updatedClients.length === 0) {
    global.__sse_clients.delete(workflowId);
  } else {
    global.__sse_clients.set(workflowId, updatedClients);
  }
  console.log(`Client removed for workflow: ${workflowId}, Remaining clients: ${updatedClients.length}`);
}

// 指定されたworkflowIdのクライアントにデータを送信
export function broadcastToWorkflow(workflowId: string, data: ProgressData): void {
  const currentClients = global.__sse_clients.get(workflowId);
  
  console.log(`Broadcasting to workflow ${workflowId}, Active clients:`, 
    currentClients?.length || 0, 
    'Total clients:', global.__sse_clients.size
  );

  if (!currentClients || currentClients.length === 0) {
    console.warn(`No active clients found for workflow: ${workflowId}`);
    return;
  }

  const message = `data: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(message);

  // 各クライアントに送信を試みる
  const failedClients: number[] = [];
  currentClients.forEach((client, index) => {
    try {
      client.controller.enqueue(encoded);
      console.log(`Message sent to client for workflow: ${workflowId}`);
    } catch (error) {
      console.error(`Failed to send message to client for workflow: ${workflowId}`, error);
      failedClients.push(index);
    }
  });

  // 失敗したクライアントを除去
  if (failedClients.length > 0) {
    const validClients = currentClients.filter((_, index) => !failedClients.includes(index));
    if (validClients.length === 0) {
      global.__sse_clients.delete(workflowId);
    } else {
      global.__sse_clients.set(workflowId, validClients);
    }
  }
}

// アクティブなクライアント数を取得
export function getActiveClientsCount(workflowId: string): number {
  return global.__sse_clients.get(workflowId)?.length || 0;
}
