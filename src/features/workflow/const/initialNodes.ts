import { Node } from 'reactflow';

export const initialNodes: Node[] = [
  // Start Node
  {
    id: "start",
    type: "terminal",
    position: { x: 600, y: 0 },
    data: {
      type: "start"
    }
  },
  // API Gateway Node
  {
    id: "api-gateway",
    type: "custom",
    position: { x: 600, y: 400 },
    data: {
      title: "Thesis API",
      description: "API Gateway Endpoint",
      icon: "/aws/api-gateway.svg",
      status: "ready",
      serviceType: "APIGateway",
      logs: "POST /api/v1/thesis\nAuthorization: IAM\nStage: prod\nRequest validation enabled\nCORS enabled",
      details: {
        endpoint: "/api/v1/thesis",
        method: "POST",
        stage: "prod",
        authType: "IAM"
      }
    }
  },
  // Main Workflow Group
  {
    id: "main-workflow",
    type: "mainGroup",
    position: { x: 0, y: 800 },
    data: { 
      label: "Main Workflow",
    },
    style: { width: 1500, height: 2400 },
  },
  // Format Lambda
  {
    id: "format-lambda",
    type: "custom",
    position: { x: 600, y: 100 },
    data: {
      title: "Format Retrieval",
      description: "Get thesis format",
      icon: "/aws/lambda.svg",
      status: "ready",
      serviceType: "Lambda",
      logs: "Function: get-thesis-format\nMemory: 256MB\nTimeout: 30s\nRuntime: Python 3.12\nRetrieving thesis format template and configuration",
      details: {
        functionName: "get-thesis-format",
        memory: 256,
        timeout: 30,
        runtime: "Python 3.12"
      }
    },
    parentNode: "main-workflow",
    extent: "parent",
  },
  // Prompt Generation Lambda
  {
    id: "prompt-lambda",
    type: "custom",
    position: { x: 600, y: 500 },
    data: {
      title: "Prompt Generation",
      description: "Generate AI prompt",
      icon: "/aws/lambda.svg",
      status: "ready",
      serviceType: "Lambda",
      logs: "Function: generate-prompt\nMemory: 256MB\nTimeout: 30s\nRuntime: Python 3.12\nGenerating optimized prompts for thesis content",
      details: {
        functionName: "generate-prompt",
        memory: 256,
        timeout: 30,
        runtime: "Python 3.12"
      }
    },
    parentNode: "main-workflow",
    extent: "parent",
  },
  // Callback Queue
  {
    id: "callback-queue",
    type: "custom",
    position: { x: 600, y: 900 },
    data: {
      title: "Callback Queue",
      description: "Sub-workflow trigger",
      icon: "/aws/sqs.svg",
      status: "ready",
      serviceType: "SQS",
      logs: "Queue: thesis-callback-queue\nMessage Retention: 4 days\nVisibility Timeout: 30s\nDelay: 0s\nHandling workflow callbacks and task tokens",
      details: {
        queueName: "thesis-callback-queue",
        messageRetention: 345600,
        visibilityTimeout: 30,
        delaySeconds: 0
      }
    },
    parentNode: "main-workflow",
    extent: "parent",
  },
  // Sub Workflow Group
  {
    id: "sub-workflow",
    type: "subGroup",
    position: { x: 1600, y: 400 },
    data: { 
      label: "Sub Workflow",
    },
    style: { width: 1400, height: 1800 },
    parentNode: "main-workflow",
    extent: "parent",
  },
  // AI Request Lambda
  {
    id: "ai-request-lambda",
    type: "custom",
    position: { x: 300, y: 150 },
    data: {
      title: "AI Request",
      description: "Generate thesis content",
      icon: "/aws/lambda.svg",
      status: "ready",
      serviceType: "Lambda",
      logs: "Function: generate-thesis\nMemory: 1024MB\nTimeout: 60s\nRuntime: Python 3.12\nMaking API calls to AI service for content generation",
      details: {
        functionName: "generate-thesis",
        memory: 1024,
        timeout: 60,
        runtime: "Python 3.12"
      }
    },
    parentNode: "sub-workflow",
    extent: "parent"
  },
  // Validation Lambda
  {
    id: "validation-lambda",
    type: "custom",
    position: { x: 300, y: 550 },
    data: {
      title: "Schema Validation",
      description: "Validate thesis data",
      icon: "/aws/lambda.svg",
      status: "ready",
      serviceType: "Lambda",
      logs: "Function: validate-thesis\nMemory: 256MB\nTimeout: 30s\nRuntime: Python 3.12\nValidating generated content against schema",
      details: {
        functionName: "validate-thesis",
        memory: 256,
        timeout: 30,
        runtime: "Python 3.12"
      }
    },
    parentNode: "sub-workflow",
    extent: "parent"
  },
  // Choice Node
  {
    id: "validation-choice",
    type: "choice",
    position: { x: 360, y: 1000 },
    data: {
      condition: "Schema\nValidation",
      logs: "Choice State\nCondition: Schema validation result\nRouting based on validation outcome"
    },
    parentNode: "sub-workflow",
    extent: "parent"
  },
  // Success Callback
  {
    id: "callback-success",
    type: "custom",
    position: { x: 300, y: 1500 },
    data: {
      title: "Success Callback",
      description: "Return task token",
      icon: "/aws/lambda.svg",
      status: "ready",
      serviceType: "Lambda",
      logs: "Function: return-token\nMemory: 256MB\nTimeout: 30s\nRuntime: Python 3.12\nReturning success callback to main workflow",
      details: {
        functionName: "return-token",
        memory: 256,
        timeout: 30,
        runtime: "Python 3.12"
      }
    },
    parentNode: "sub-workflow",
    extent: "parent"
  },
  // Data Fix
  {
    id: "data-fix",
    type: "custom",
    position: { x: 850, y: 978 },
    data: {
      title: "Data Fix",
      description: "Fix thesis data",
      icon: "/aws/lambda.svg",
      status: "ready",
      serviceType: "Lambda",
      logs: "Function: fix-thesis-data\nMemory: 256MB\nTimeout: 30s\nRuntime: Python 3.12\nApplying fixes to invalid thesis content",
      details: {
        functionName: "fix-thesis-data",
        memory: 256,
        timeout: 30,
        runtime: "Python 3.12"
      }
    },
    parentNode: "sub-workflow",
    extent: "parent"
  },
  // Parallel Image Generation Nodes
  {
    id: "formula-gen",
    type: "custom",
    position: { x: 100, y: 1500 },
    data: {
      title: "Formula Generator",
      description: "Generate formula images",
      icon: "/aws/lambda.svg",
      status: "ready",
      serviceType: "Lambda",
      logs: "Function: generate-formulas\nMemory: 512MB\nTimeout: 60s\nRuntime: Python 3.12\nGenerating LaTeX formula images",
      details: {
        functionName: "generate-formulas",
        memory: 512,
        timeout: 60,
        runtime: "Python 3.12"
      }
    },
    parentNode: "main-workflow",
    extent: "parent",
  },
  // Table Generator
  {
    id: "table-gen",
    type: "custom",
    position: { x: 600, y: 1500 },
    data: {
      title: "Table Generator",
      description: "Generate table images",
      icon: "/aws/lambda.svg",
      status: "ready",
      serviceType: "Lambda",
      logs: "Function: generate-tables\nMemory: 512MB\nTimeout: 60s\nRuntime: Python 3.12\nGenerating table visualizations",
      details: {
        functionName: "generate-tables",
        memory: 512,
        timeout: 60,
        runtime: "Python 3.12"
      }
    },
    parentNode: "main-workflow",
    extent: "parent",
  },
  // Graph Generator
  {
    id: "graph-gen",
    type: "custom",
    position: { x: 1100, y: 1500 },
    data: {
      title: "Graph Generator",
      description: "Generate graph images",
      icon: "/aws/lambda.svg",
      status: "ready",
      serviceType: "Lambda",
      logs: "Function: generate-graphs\nMemory: 512MB\nTimeout: 60s\nRuntime: Python 3.12\nGenerating data visualizations and charts",
      details: {
        functionName: "generate-graphs",
        memory: 512,
        timeout: 60,
        runtime: "Python 3.12"
      }
    },
    parentNode: "main-workflow",
    extent: "parent",
  },
  // PDF Format Lambda
  {
    id: "pdf-format",
    type: "custom",
    position: { x: 400, y: 2000 },
    data: {
      title: "PDF Formatter",
      description: "Format thesis as PDF",
      icon: "/aws/lambda.svg",
      status: "ready",
      serviceType: "Lambda",
      logs: "Function: format-pdf\nMemory: 1024MB\nTimeout: 60s\nRuntime: Python 3.12\nCompiling final PDF document",
      details: {
        functionName: "format-pdf",
        memory: 1024,
        timeout: 60,
        runtime: "Python 3.12"
      }
    },
    parentNode: "main-workflow",
    extent: "parent",
  },
  // S3 Bucket
  {
    id: "thesis-bucket",
    type: "custom",
    position: { x: 900, y: 2000 },
    data: {
      title: "Thesis Bucket",
      description: "Store generated thesis",
      icon: "/aws/s3.svg",
      status: "ready",
      serviceType: "S3",
      logs: "Bucket: fake-thesis-bucket\nVersioning: Enabled\nEncryption: AES-256\nAccess: Private\nStoring generated thesis documents",
      details: {
        bucketName: "fake-thesis-bucket",
        versioning: true,
        encryption: "AES-256",
        accessControl: "Private"
      }
    },
    parentNode: "main-workflow",
    extent: "parent",
  },
  // End Node
  {
    id: "end",
    type: "terminal",
    position: { x: 600, y: 3300 },
    data: {
      type: "end"
    }
  }
];