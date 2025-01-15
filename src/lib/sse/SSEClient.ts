import { ProgressData } from "@/features/workflow/types/types";

interface Client {
  workflowId: string;
  controller: ReadableStreamDefaultController;
}

export default class SSEClient {
  // 静的プロパティ：クライアントのデータを格納
  private static clients: Map<string, Client[]> = new Map();

  // クライアントを追加
  static addClient(workflowId: string, controller: ReadableStreamDefaultController): void {
    const currentClients = this.clients.get(workflowId) || [];
    currentClients.push({ workflowId, controller });
    this.clients.set(workflowId, currentClients);
    console.log(`Client added for workflow: ${workflowId}, Total clients: ${currentClients.length}`);
  }

  // クライアントを削除
  static removeClient(workflowId: string, controller: ReadableStreamDefaultController): void {
    const currentClients = this.clients.get(workflowId);
    if (!currentClients) return;

    const updatedClients = currentClients.filter(client => client.controller !== controller);
    if (updatedClients.length === 0) {
      this.clients.delete(workflowId);
    } else {
      this.clients.set(workflowId, updatedClients);
    }
    console.log(`Client removed for workflow: ${workflowId}, Remaining clients: ${updatedClients.length}`);
  }

  // 指定されたworkflowIdのクライアントにデータを送信
  static broadcastToWorkflow(workflowId: string, data: ProgressData): void {
    const currentClients = this.clients.get(workflowId);

    console.log(`Broadcasting to workflow ${workflowId}, Active clients:`, 
      currentClients?.length || 0
    );

    if (!currentClients || currentClients.length === 0) {
      console.warn(`No active clients found for workflow: ${workflowId}`);
      return;
    }

    const message = `data: ${JSON.stringify(data)}\n\n`;
    const encoded = new TextEncoder().encode(message);

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
        this.clients.delete(workflowId);
      } else {
        this.clients.set(workflowId, validClients);
      }
    }
  }

  // アクティブなクライアント数を取得
  static getActiveClientsCount(workflowId: string): number {
    return this.clients.get(workflowId)?.length || 0;
  }
}

