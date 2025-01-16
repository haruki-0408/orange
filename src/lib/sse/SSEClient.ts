import Redis from 'ioredis';
import { ProgressData } from "@/features/workflow/types/types";

export default class SSEClient {
  private static redisPublish = new Redis(process.env.KV_URL!);
  private static redisSubscribe = new Redis(process.env.KV_URL!);

  // SSE接続の開始とRedisのサブスクライブ
  static async subscribeRedis(workflowId: string, controller: ReadableStreamDefaultController): Promise<void> {
    try {
      // コントローラーを保存
      // this.controllers.set(workflowId, controller);
      this.redisSubscribe.subscribe(workflowId, (error) => {
        if (error) {
          console.error('Failed to set client:', error);
        }
      });

      this.redisSubscribe.on('message', (channel, message) => {
        console.log(`Received message on channel ${channel}: ${message}`);
        controller.enqueue(new TextEncoder().encode(`data: ${message}\n\n`));
      });

      console.log(`Subscribed to channel for workflow: ${workflowId}`);
    } catch (error) {
      console.error('Failed to add client:', error);
      throw error;
    }
  }

  // SSE接続の終了とサブスクライブ解除
  static async unsubscribeRedis(workflowId: string): Promise<void> {
    try {
      // サブスクリプション解除
      await this.redisSubscribe.unsubscribe(workflowId);
      
      // コントローラーを削除
      // this.controllers.delete(workflowId);
      
      console.log(`Unsubscribed from channel for workflow: ${workflowId}`);
    } catch (error) {
      console.error('Failed to remove client:', error);
      throw error;
    }
  }

  // Lambdaからの通知をパブリッシュ
  static async publishProgress(workflowId: string, data: ProgressData): Promise<void> {
    try {
      await this.redisPublish.publish(
        workflowId,
        JSON.stringify(data)
      );
      
      console.log(`Published progress for workflow: ${workflowId}`);
    } catch (error) {
      console.error('Failed to publish progress:', error);
      throw error;
    }
  }
}