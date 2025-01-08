import { LogData } from "../types/types";

export const mockLogData: LogData[] = [
  {
    id: 'err-001',
    level: 'error',
    timestamp: '2024-03-14T10:00:01.782Z',
    service: 'Lambda',
    stateName: 'AI Request',
    logGroupName: '/aws/lambda/melon_dev_request_generative_ai_model_api',
    logEntries: [
        {
          timestamp: "2024-12-08T08:48:59.536Z",
          ingestionTime: "2024-12-08T08:49:00.376Z",
          message: "START RequestId: c1b29677-26bc-4373-b9fc-d0d767fe22d3 Version: $LATEST\n"
        },
        {
          timestamp: "2024-12-08T08:48:59.538Z",
          ingestionTime: "2024-12-08T08:49:00.376Z",
          message: "{\"level\":\"INFO\",\"location\":\"decorate:448\",\"message\":{\"workflow_id\":\"test_workflow_id\",\"sections_format\":{...}}}"
        },
        {
          timestamp: "2024-12-08T08:50:19.849Z",
          ingestionTime: "2024-12-08T08:50:28.874Z",
          message: "====== セクション: 考察 ======\n"
        },
        {
          timestamp: "2024-12-08T08:51:00.912Z",
          ingestionTime: "2024-12-08T08:51:09.932Z",
          message: "==== Response Usage ====\n"
        },
        {
          timestamp: "2024-12-08T08:51:45.054Z",
          ingestionTime: "2024-12-08T08:51:54.069Z",
          message: "{\"level\":\"INFO\",\"location\":\"lambda_handler:109\",\"message\":\"本研究は、野菜の光合成システムを革新的なエネルギー変換技術として再定義する挑戦的な試みである...\"}"
        },
        {
          timestamp: "2024-12-08T08:51:45.062Z",
          ingestionTime: "2024-12-08T08:51:54.069Z",
          message: "END RequestId: c1b29677-26bc-4373-b9fc-d0d767fe22d3\n"
        },
        {
          timestamp: "2024-12-08T08:51:45.062Z",
          ingestionTime: "2024-12-08T08:51:54.069Z",
          message: "REPORT RequestId: c1b29677-26bc-4373-b9fc-d0d767fe22d3\tDuration: 165523.76 ms\tBilled Duration: 165524 ms\tMemory Size: 512 MB\tMax Memory Used: 98 MB\tInit Duration: 1643.64 ms\t\n"
        }
      ]
    }
]; 
