import { TraceData } from '@/features/workflow/types/types';

export const mockTraces: TraceData[] = [
  {
    id: "start",
    name: "Start Workflow",
    duration: 12,
    startTime: "2024-03-14 10:00:00.000",
    status: "success",
    serviceType: "StepFunctions",
    details: {
      requestId: "sf-001",
      resourceName: "thesis-workflow-start"
    }
  },
  {
    id: "api-gateway",
    name: "Thesis API Request",
    duration: 45,
    startTime: "2024-03-14 10:00:00.045",
    status: "success",
    serviceType: "APIGateway",
    details: {
      requestId: "ag-001",
      resourceName: "/api/v1/thesis",
      memoryUsed: 0
    }
  },
  {
    id: "format-lambda",
    name: "Format Retrieval",
    duration: 235,
    startTime: "2024-03-14 10:00:00.090",
    status: "success",
    serviceType: "Lambda",
    details: {
      requestId: "lm-001",
      resourceName: "get-thesis-format",
      memoryUsed: 128,
      coldStart: true
    }
  },
  {
    id: "prompt-lambda",
    name: "Prompt Generation",
    duration: 189,
    startTime: "2024-03-14 10:00:00.325",
    status: "success",
    serviceType: "Lambda",
    details: {
      requestId: "lm-002",
      resourceName: "generate-prompt",
      memoryUsed: 256
    }
  },
  {
    id: "callback-queue",
    name: "SQS Message Processing",
    duration: 23,
    startTime: "2024-03-14 10:00:00.514",
    status: "success",
    serviceType: "SQS",
    details: {
      requestId: "sqs-001",
      resourceName: "thesis-callback-queue"
    }
  },
  {
    id: "ai-request-lambda",
    name: "AI Content Generation",
    duration: 1245,
    startTime: "2024-03-14 10:00:00.537",
    status: "success",
    serviceType: "Lambda",
    details: {
      requestId: "lm-003",
      resourceName: "generate-thesis",
      memoryUsed: 1024,
      coldStart: true
    },
  },
  {
    id: "validation-lambda",
    name: "Schema Validation",
    duration: 156,
    startTime: "2024-03-14 10:00:01.782",
    status: "success",
    serviceType: "Lambda",
    details: {
      requestId: "lm-004",
      resourceName: "validate-thesis",
      memoryUsed: 256
    }
  },
  {
    id: "validation-choice",
    name: "Validation Result Check",
    duration: 10,
    startTime: "2024-03-14 10:00:01.938",
    status: "success",
    serviceType: "Choice",
    details: {
      requestId: "ch-001",
      resourceName: "validation-choice"
    }
  },
  {
    id: "callback-success",
    name: "Success Callback",
    duration: 134,
    startTime: "2024-03-14 10:00:01.948",
    status: "success",
    serviceType: "Lambda",
    details: {
      requestId: "lm-005",
      resourceName: "return-token",
      memoryUsed: 256
    }
  },
  {
    id: "data-fix",
    name: "Data Fix Process",
    duration: 245,
    startTime: "2024-03-14 10:00:01.948",
    status: "success",
    serviceType: "Lambda",
    details: {
      requestId: "lm-006",
      resourceName: "fix-thesis-data",
      memoryUsed: 256
    }
  },
  {
    id: "formula-gen",
    name: "Formula Generation",
    duration: 567,
    startTime: "2024-03-14 10:00:02.082",
    status: "success",
    serviceType: "Lambda",
    details: {
      requestId: "lm-007",
      resourceName: "generate-formulas",
      memoryUsed: 512
    }
  },
  {
    id: "table-gen",
    name: "Table Generation",
    duration: 678,
    startTime: "2024-03-14 10:00:02.082",
    status: "success",
    serviceType: "Lambda",
    details: {
      requestId: "lm-008",
      resourceName: "generate-tables",
      memoryUsed: 512
    }
  },
  {
    id: "graph-gen",
    name: "Graph Generation",
    duration: 789,
    startTime: "2024-03-14 10:00:02.082",
    status: "success",
    serviceType: "Lambda",
    details: {
      requestId: "lm-009",
      resourceName: "generate-graphs",
      memoryUsed: 512
    }
  },
  {
    id: "pdf-format",
    name: "PDF Formatting",
    duration: 890,
    startTime: "2024-03-14 10:00:02.871",
    status: "success",
    serviceType: "Lambda",
    details: {
      requestId: "lm-010",
      resourceName: "format-pdf",
      memoryUsed: 1024
    }
  },
  {
    id: "thesis-bucket",
    name: "S3 Storage",
    duration: 145,
    startTime: "2024-03-14 10:00:03.761",
    status: "success",
    serviceType: "S3",
    details: {
      requestId: "s3-001",
      resourceName: "fake-thesis-bucket"
    }
  },
  {
    id: "end",
    name: "Workflow Completion",
    duration: 8,
    startTime: "2024-03-14 10:00:03.906",
    status: "success",
    serviceType: "StepFunctions",
    details: {
      requestId: "sf-002",
      resourceName: "thesis-workflow-end"
    }
  }
]; 