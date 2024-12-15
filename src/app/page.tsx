"use client";
import { MultiplayerLayer } from "@/features/workflow/components/MultiplayerLayer";
import { Room } from "@/features/room/pages/Room";
import { Workflow } from "@/features/workflow/pages/Workflow";
import { useState, useEffect } from "react";

export default function Home() {
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  // SSE接続
  useEffect(() => {
    if (!workflowId) return;

    const eventSource = new EventSource(`/api/sse/${workflowId}`);
    console.log("SSE接続開始:", `/api/sse/${workflowId}`);

    eventSource.onopen = () => {
      console.log("SSE接続成功");
    };

    eventSource.onmessage = (event) => {
      console.log("受信したメッセージ:", event);
      try {
        const data = JSON.parse(event.data);
        setProgress(data.progress);
      } catch (error) {
        console.error("メッセージエラー:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE接続エラー:", error);
      eventSource.close();
    };

    return () => {
      console.info("SSE接続終了");
      eventSource.close();
    };
  }, [workflowId]);

  return (
    <Room>
      <div className="w-full h-full">
        <MultiplayerLayer>
          {workflowId && (
            <div className="absolute top-4 left-4 z-50 bg-black/50 p-2 rounded text-white">
              Connecting to workflow .......
            </div>
          )}
          {progress && (
            <div className="absolute top-4 right-4 z-50 bg-black/50 p-2 rounded text-white">
              Progress: {progress}
            </div>
          )}
          <Workflow
            className="w-full h-full my-4"
            onWorkflowStart={setWorkflowId}
            onProgressUpdate={setProgress}
          />
        </MultiplayerLayer>
      </div>
    </Room>
  );
}
