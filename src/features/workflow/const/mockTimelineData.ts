import { TimelineTraceData } from "../types/types";

export const mockTimelineData: TimelineTraceData[] = [
  {
    state_name: "api-gateway",
    duration: 2000,
    start_at: "20:14:20",
    request_id: "453972f0-bd78-4edb-b92e-74f162d34751",
    memory_size: null,
    memory_used: null,
    is_cold_start: null
  },
  {
    state_name: "format-lambda",
    duration: 1777,
    memory_size: 256,
    memory_used: 131,
    start_at: "20:14:22",
    is_cold_start: true,
    request_id: "c0d5710b-de30-43c0-bae0-27220db0a69c"
  },
  {
    state_name: "prompt-lambda",
    duration: 744,
    memory_size: 512,
    memory_used: 125,
    start_at: "20:14:26",
    is_cold_start: true,
    request_id: "1a82f8fb-d1ec-4ab7-9742-b31958f617a3"
  },
  {
    state_name: "callback-queue",
    duration: 32,
    start_at: "20:14:26",
    request_id: null,
    memory_size: null,
    memory_used: null,
    is_cold_start: null
  },
  {
    state_name: "ai-request-lambda",
    duration: 80616,
    memory_size: 512,
    memory_used: 153,
    start_at: "20:15:51",
    is_cold_start: true,
    request_id: "d48bd250-3d8b-47ba-81ae-99d2177cc66a"
  },
  {
    state_name: "validation-lambda",
    duration: 4533,
    memory_size: 256,
    memory_used: 139,
    start_at: "20:15:59",
    is_cold_start: true,
    request_id: "0b99612c-02f5-489c-9cb3-0dcbf2e3dbaa"
  },
  {
    state_name: "callback-success-lambda",
    duration: 1089,
    memory_size: 256,
    memory_used: 126,
    start_at: "20:16:03",
    is_cold_start: true,
    request_id: "1894eea8-cac2-4334-b8a1-2f7b68ac0f3d"
  },
  {
    state_name: "table-gen-lambda",
    duration: 1325,
    memory_size: 1024,
    memory_used: 158,
    start_at: "20:16:07",
    is_cold_start: true,
    request_id: "c8a2e9c6-38b0-4cbf-bd41-3a55e254d4c4"
  },
  {
    state_name: "formula-gen-lambda",
    duration: 2937,
    memory_size: 512,
    memory_used: 162,
    start_at: "20:16:09",
    is_cold_start: true,
    request_id: "8e8031af-1adc-4c69-bf28-865ba39873a2"
  },
  {
    state_name: "graph-gen-lambda",
    duration: 2144,
    memory_size: 1024,
    memory_used: 218,
    start_at: "20:16:11",
    is_cold_start: true,
    request_id: "f8a2a80c-ada3-46f6-b7c0-b7d65d6f3342"
  },
  {
    state_name: "pdf-format-lambda",
    duration: 6335,
    memory_size: 512,
    memory_used: 174,
    start_at: "20:16:20",
    is_cold_start: true,
    request_id: "a79d6c82-cd98-40c7-8e4d-0536044dcaf0"
  }
];
