'use client'
import React, { useState } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import styles from './style.module.scss';
import clsx from 'clsx';
import { FCX } from '@/types/types';

type ServiceType = 'Lambda' | 'SQS' | 'APIGateway' | 'DynamoDB' | 'S3';
type StatusType = 'pending' | 'success' | 'failed' | 'progress' | 'stopped';

interface CustomNodeData {
  title: string;
  description: string;
  icon?: string;
  status: StatusType;
  code: string;
  serviceType: ServiceType;
}

const getServiceTypeClasses = (serviceType: ServiceType, baseClass: string) => {
  return clsx(baseClass, {
    [styles.lambdaNode]: serviceType === 'Lambda',
    [styles.sqsNode]: serviceType === 'SQS',
    [styles.apiGatewayNode]: serviceType === 'APIGateway',
    [styles.dynamodbNode]: serviceType === 'DynamoDB',
    [styles.s3Node]: serviceType === 'S3',
  });
};

export const CustomNode: FCX<NodeProps<CustomNodeData>> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);

  const nodeClasses = getServiceTypeClasses(data.serviceType, styles.customNode);
  const buttonClasses = getServiceTypeClasses(data.serviceType, styles.toggleButton);
  const codeBlockClasses = getServiceTypeClasses(data.serviceType, styles.codeBlock);
  const badgeClasses = clsx(
    styles.badge,
    styles[data.status.toLowerCase()],
    {
      [styles.lambdaNode]: data.serviceType === 'Lambda',
      [styles.sqsNode]: data.serviceType === 'SQS',
      [styles.apiGatewayNode]: data.serviceType === 'APIGateway',
      [styles.dynamodbNode]: data.serviceType === 'DynamoDB',
      [styles.s3Node]: data.serviceType === 'S3',
    }
  );

  return (
    <div className={styles.customNodeWrapper}>
      <Handle type="target" position={Position.Top} />
      <div className={nodeClasses}>
        <div className={styles.header}>
          {data.icon && <div className={styles.icon}>{data.icon}</div>}
          <div className={styles.titleArea}>
            <h3 className={styles.title}>{data.title}</h3>
            <p className={styles.description}>{data.description}</p>
          </div>
        </div>
        <hr className={styles.separator} />
        <button 
          className={buttonClasses}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? 'Hide Code' : 'Show Code'}
        </button>
        {isOpen && (
          <pre className={codeBlockClasses}>
            <code>{data.code}</code>
          </pre>
        )}
        <div className={badgeClasses}>
          {data.status}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default CustomNode;
