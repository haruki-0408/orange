import { Node } from '@xyflow/react';

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
    style: { width: 1500, height: 2500 },
  },
  // Format Service Group
  {
    id: "format-services",
    type: "supportingGroup",
    position: { x: 350, y: 100 },
    data: { 
      label: "Format Services",
    },
    style: { width: 800, height: 400 },
    parentId: "main-workflow",
    extent: "parent",
  },
  // PDF Service Group
  {
    id: "pdf-services",
    type: "supportingGroup",
    position: { x: 350, y: 2000 },
    data: { 
      label: "PDF Services",
    },
    style: { width: 800, height: 400 },
    parentId: "main-workflow",
    extent: "parent",
  },
  // Format Lambda
  {
    id: "format-lambda",
    type: "custom",
    position: { x: 70, y: 70 },
    data: {
      title: "Format Retrieval",
      description: "Get thesis format",
      icon: "/aws/lambda.svg",
      status: "ready",
      serviceType: "Lambda",
      details: {
        functionName: "get-thesis-format",
        memory: 256,
        timeout: 30,
        runtime: "Python 3.12"
      }
    },
    parentId: "format-services",
    extent: "parent",
  },
  // DynamoDB
  {
    id: "category-table",
    type: "custom",
    position: { x: 450, y: 60 },
    data: {
      title: "Category Table",
      description: "Store category data",
      icon: "/aws/dynamodb.svg",
      status: "ready",
      serviceType: "DynamoDB",
      isSupporting: true,
      details: {
        tableName: "category-table",
        partitionKey: "category_id",
        sortKey: "timestamp",
      }
    },
    parentId: "format-services",
    extent: "parent",
  },
  // Prompt Generation Lambda
  {
    id: "prompt-lambda",
    type: "custom",
    position: { x: 600, y: 700 },
    data: {
      title: "Prompt Generation",
      description: "Generate AI prompt",
      icon: "/aws/lambda.svg",
      status: "ready",
      serviceType: "Lambda",
      details: {
        functionName: "generate-prompt",
        memory: 256,
        timeout: 30,
        runtime: "Python 3.12"
      }
    },
    parentId: "main-workflow",
    extent: "parent",
  },
  // Callback Queue
  {
    id: "callback-queue",
    type: "custom",
    position: { x: 600, y: 1100 },
    data: {
      title: "Callback Queue",
      description: "Sub-workflow trigger",
      icon: "/aws/sqs.svg",
      status: "ready",
      serviceType: "SQS",
      details: {
        queueName: "thesis-callback-queue",
        messageRetention: 345600,
        visibilityTimeout: 30,
        delaySeconds: 0
      }
    },
    parentId: "main-workflow",
    extent: "parent",
  },
  // Sub Workflow Group
  {
    id: "sub-workflow",
    type: "subGroup",
    position: { x: 1700, y: 1000 },
    data: { 
      label: "Sub Workflow",
    },
    style: { width: 1400, height: 1800 },
    // parentId: "main-workflow",
    // extent: "parent",
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
      details: {
        functionName: "generate-thesis",
        memory: 1024,
        timeout: 60,
        runtime: "Python 3.12"
      }
    },
    parentId: "sub-workflow",
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
      details: {
        functionName: "validate-thesis",
        memory: 256,
        timeout: 30,
        runtime: "Python 3.12"
      }
    },
    parentId: "sub-workflow",
    extent: "parent"
  },
  // Choice Node
  {
    id: "validation-choice",
    type: "choice",
    position: { x: 370, y: 970 },
    data: {
      condition: "Schema\nValidation",
    },
    parentId: "sub-workflow",
    extent: "parent"
  },
  // Success Callback
  {
    id: "callback-success-lambda",
    type: "custom",
    position: { x: 300, y: 1500 },
    data: {
      title: "Success Callback",
      description: "Return task token",
      icon: "/aws/lambda.svg",
      status: "ready",
      serviceType: "Lambda",
      details: {
        functionName: "return-token",
        memory: 256,
        timeout: 30,
        runtime: "Python 3.12"
      }
    },
    parentId: "sub-workflow",
    extent: "parent"
  },
  // Data Fix
  {
    id: "data-fix-lambda",
    type: "custom",
    position: { x: 840, y: 978 },
    data: {
      title: "Data Fix",
      description: "Fix thesis data",
      icon: "/aws/lambda.svg",
      status: "ready",
      serviceType: "Lambda",
      details: {
        functionName: "fix-thesis-data",
        memory: 256,
        timeout: 30,
        runtime: "Python 3.12"
      }
    },
    parentId: "sub-workflow",
    extent: "parent"
  },
  // Parallel Image Generation Nodes
  {
    id: "formula-gen-lambda",
    type: "custom",
    position: { x: 100, y: 1600 },
    data: {
      title: "Formula Generator",
      description: "Generate formula images",
      icon: "/aws/lambda.svg",
      status: "ready",
      serviceType: "Lambda",
      details: {
        functionName: "generate-formulas",
        memory: 512,
        timeout: 60,
        runtime: "Python 3.12"
      }
    },
    parentId: "main-workflow",
    extent: "parent",
  },
  // Table Generator
  {
    id: "table-gen-lambda",
    type: "custom",
    position: { x: 600, y: 1600 },
    data: {
      title: "Table Generator",
      description: "Generate table images",
      icon: "/aws/lambda.svg",
      status: "ready",
      serviceType: "Lambda",
      details: {
        functionName: "generate-tables",
        memory: 512,
        timeout: 60,
        runtime: "Python 3.12"
      }
    },
    parentId: "main-workflow",
    extent: "parent",
  },
  // Graph Generator
  {
    id: "graph-gen-lambda",
    type: "custom", 
    position: { x: 1100, y: 1600 },
    data: {
      title: "Graph Generator",
      description: "Generate graph images",
      icon: "/aws/lambda.svg",
      status: "ready",
      serviceType: "Lambda",
      details: {
        functionName: "generate-graphs",
        memory: 512,
        timeout: 60,
        runtime: "Python 3.12"
      }
    },
    parentId: "main-workflow",
    extent: "parent",
  },
  // PDF Format Lambda
  {
    id: "pdf-format-lambda",
    type: "custom",
    position: { x: 70, y: 70 },
    data: {
      title: "PDF Formatter",
      description: "Format thesis as PDF",
      icon: "/aws/lambda.svg",
      status: "ready",
      serviceType: "Lambda",
      details: {
        functionName: "format-pdf",
        memory: 1024,
        timeout: 60,
        runtime: "Python 3.12"
      }
    },
    parentId: "pdf-services",
    extent: "parent",
  },
  // S3 Bucket
  {
    id: "thesis-bucket",
    type: "custom",
    position: { x: 450, y: 60 },
    data: {
      title: "Thesis Bucket",
      description: "Store generated thesis",
      icon: "/aws/s3.svg",
      status: "ready",
      serviceType: "S3",
      isSupporting: true,
      details: {
        bucketName: "fake-thesis-bucket",
        versioning: true,
        encryption: "AES-256",
        accessControl: "Private"
      }
    },
    parentId: "pdf-services",
    extent: "parent",
  },
  // End Node
  {
    id: "end",
    type: "terminal",
    position: { x: 560, y: 3400 },
    data: {
      type: "end"
    }
  }
];