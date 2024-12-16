import React, { useState, memo } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import styles from './style.module.scss';
import clsx from 'clsx';
import { FCX } from '@/types/types';
import Image from 'next/image';
import { StatusType, ServiceType, ServiceDetails } from '@/features/workflow/types/types';

interface Props {
  title: string;
  description: string;
  icon?: string;
  status: StatusType;
  logs: string;
  serviceType: ServiceType;
  details: Partial<ServiceDetails[ServiceType]>;
}

export const CustomNode: FCX<NodeProps<Props>> = memo(({ data }) => {
  const [isOpen, setIsOpen] = useState(false);

  const renderServiceDetails = () => {
    switch (data.serviceType) {
      case 'Lambda':
        const lambdaDetails = data.details as ServiceDetails['Lambda'];
        return (
          <div className={styles.serviceDetails}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Function:</span>
              <span className={styles.detailValue}>{lambdaDetails.functionName}</span>
            </div>
            <div className={styles.detailsRow}>
              <div className={styles.detailChip}>
                <span className={styles.chipIcon}>💾</span>
                {lambdaDetails.memory}MB
              </div>
              <div className={styles.detailChip}>
                <span className={styles.chipIcon}>⏱️</span>
                {lambdaDetails.timeout}s
              </div>
              <div className={styles.detailChip}>
                <span className={styles.chipIcon}>⚡</span>
                {lambdaDetails.runtime}
              </div>
            </div>
          </div>
        );

      case 'DynamoDB':
        const dynamoDetails = data.details as ServiceDetails['DynamoDB'];
        return (
          <div className={styles.serviceDetails}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Table:</span>
              <span className={styles.detailValue}>{dynamoDetails.tableName}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Primary Key:</span>
              <span className={styles.detailValue}>{dynamoDetails.primaryKey}</span>
            </div>
            <div className={styles.detailsRow}>
              <div className={styles.detailChip}>
                <span className={styles.chipIcon}>📖</span>
                RCU: {dynamoDetails.readCapacity}
              </div>
              <div className={styles.detailChip}>
                <span className={styles.chipIcon}>📝</span>
                WCU: {dynamoDetails.writeCapacity}
              </div>
            </div>
            {dynamoDetails.indexes && (
              <div className={styles.indexList}>
                {dynamoDetails.indexes.map((index, i) => (
                  <div key={i} className={styles.indexChip}>{index}</div>
                ))}
              </div>
            )}
          </div>
        );

      case 'SQS':
        const sqsDetails = data.details as ServiceDetails['SQS'];
        return (
          <div className={styles.serviceDetails}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Queue:</span>
              <span className={styles.detailValue}>{sqsDetails.queueName}</span>
            </div>
            <div className={styles.detailsRow}>
              <div className={styles.detailChip}>
                <span className={styles.chipIcon}>🕒</span>
                Retention: {sqsDetails.messageRetention}s
              </div>
              <div className={styles.detailChip}>
                <span className={styles.chipIcon}>👁️</span>
                Visibility: {sqsDetails.visibilityTimeout}s
              </div>
              <div className={styles.detailChip}>
                <span className={styles.chipIcon}>⏳</span>
                Delay: {sqsDetails.delaySeconds}s
              </div>
            </div>
          </div>
        );

      case 'APIGateway':
        const apiDetails = data.details as ServiceDetails['APIGateway'];
        return (
          <div className={styles.serviceDetails}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Endpoint:</span>
              <span className={styles.detailValue}>{apiDetails.endpoint}</span>
            </div>
            <div className={styles.detailsRow}>
              <div className={styles.detailChip}>
                <span className={styles.chipIcon}>🔄</span>
                {apiDetails.method}
              </div>
              <div className={styles.detailChip}>
                <span className={styles.chipIcon}>🌐</span>
                Stage: {apiDetails.stage}
              </div>
              <div className={styles.detailChip}>
                <span className={styles.chipIcon}>🔒</span>
                Auth: {apiDetails.authType}
              </div>
            </div>
          </div>
        );

      case 'S3':
        const s3Details = data.details as ServiceDetails['S3'];
        return (
          <div className={styles.serviceDetails}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Bucket:</span>
              <span className={styles.detailValue}>{s3Details.bucketName}</span>
            </div>
            <div className={styles.detailsRow}>
              <div className={styles.detailChip}>
                <span className={styles.chipIcon}>📚</span>
                Versioning: {s3Details.versioning ? 'Enabled' : 'Disabled'}
              </div>
              <div className={styles.detailChip}>
                <span className={styles.chipIcon}>🔐</span>
                {s3Details.encryption}
              </div>
              <div className={styles.detailChip}>
                <span className={styles.chipIcon}>👥</span>
                {s3Details.accessControl}
              </div>
            </div>
          </div>
        );
    }
  };

  // Handleのスタイル
  const handleStyle = {
    width: '10px',
    height: '10px',
    background: '#555',
    border: '1px solid #333',
  };

  return (
    <div className={styles.customNodeWrapper}>
      {/* 上部のHandles */}
      <Handle
        id="target-top"
        type="target"
        position={Position.Top}
        style={handleStyle}
        className={styles.handle}
      />
      <Handle
        id="source-top"
        type="source"
        position={Position.Top}
        style={handleStyle}
        className={styles.handle}
      />

      {/* 左側のHandles */}
      <Handle
        id="target-left"
        type="target"
        position={Position.Left}
        style={handleStyle}
        className={styles.handle}
      />
      <Handle
        id="source-left"
        type="source"
        position={Position.Left}
        style={handleStyle}
        className={styles.handle}
      />

      <div className={clsx(styles.customNode, styles[data.status], styles[data.serviceType])}>
        <div className={styles.statusIndicator} />
        <div className={clsx(styles.badge, styles[data.status])}>
          {data.status}
        </div>
        <div className={styles.header}>
          {data.icon && (
            <div className={styles.icon}>
              <Image
                src={data.icon}
                alt={data.serviceType}
                width={24}
                height={24}
              />
            </div>
          )}
          <div className={styles.titleArea}>
            <h3 className={styles.title}>{data.title}</h3>
            <p className={styles.description}>{data.description}</p>
          </div>
        </div>
        {renderServiceDetails()}
        <hr className={styles.separator} />
        <button 
          className={clsx(styles.toggleButton, isOpen && styles.open)}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{isOpen ? 'Hide details' : 'View details'}</span>
          <svg 
            width="10" 
            height="6" 
            viewBox="0 0 10 6" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M1 1L5 5L9 1" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className={clsx(styles.codeBlock, isOpen && styles.open)}>
          <code>{data.logs}</code>
        </div>
      </div>

      {/* 右側のHandles */}
      <Handle
        id="target-right"
        type="target"
        position={Position.Right}
        style={handleStyle}
        className={styles.handle}
      />
      <Handle
        id="source-right"
        type="source"
        position={Position.Right}
        style={handleStyle}
        className={styles.handle}
      />

      {/* 下部のHandles */}
      <Handle
        id="target-bottom"
        type="target"
        position={Position.Bottom}
        style={handleStyle}
        className={styles.handle}
      />
      <Handle
        id="source-bottom"
        type="source"
        position={Position.Bottom}
        style={handleStyle}
        className={styles.handle}
      />
    </div>
  );
});

export default CustomNode;
