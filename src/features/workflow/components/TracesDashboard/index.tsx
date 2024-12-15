'use client'
import React, { useState } from 'react';
import { FCX } from '@/types/types';
import styles from './style.module.scss';
import { useReactFlow, Node } from 'reactflow';
import { TraceData } from '@/features/workflow/types/types';
interface Props {
  workflowId?: string;
  traces?: TraceData[];
  currentNodeId?: string;
}

export const TracesDashboard: FCX<Props> = ({ workflowId, traces, currentNodeId }) => {
  const { setCenter, getNode } = useReactFlow();
  const [openSections, setOpenSections] = useState({
    metrics: true,
    timeline: true,
    errors: true
  });

  // 親ノードの位置を再帰的に計算する関数
  const calculateAbsolutePosition = (node: Node) => {
    let absoluteX = node.position.x;
    let absoluteY = node.position.y;
    let currentNode = node as Node;

    // 親ノードが存在する限り位置を加算
    while (currentNode.parentNode) {
      const parentNode = getNode(currentNode.parentNode);
      if (parentNode) {
        absoluteX += parentNode.position.x;
        absoluteY += parentNode.position.y;
        currentNode = parentNode;
      } else {
        break;
      }
    }

    return { x: absoluteX, y: absoluteY };
  };

  const handleTraceClick = (nodeId: string) => {
    const node = getNode(nodeId);
    if (node) {
      // 絶対位置を計算
      const absolutePosition = calculateAbsolutePosition(node);
      const centerX = absolutePosition.x + (node.width || 0) / 2;
      const centerY = absolutePosition.y + (node.height || 0) / 2;

      setCenter(
        centerX,
        centerY,
        { 
          zoom: 1.5,
          duration: 800
        }
      );
    }
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className={styles.dashboard}>
      {/* Workflow Overview - 常に表示 */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Workflow Overview</h2>
        <div className={styles.overviewGrid}>
          <div className={styles.overviewCard}>
            <div className={styles.cardLabel}>Workflow ID</div>
            <div className={styles.cardValue}>{workflowId || '-'}</div>
          </div>
          <div className={styles.overviewCard}>
            <div className={styles.cardLabel}>Total Duration</div>
            <div className={styles.cardValue}>2.45s</div>
          </div>
          <div className={styles.overviewCard}>
            <div className={styles.cardLabel}>Services Used</div>
            <div className={styles.cardValue}>8</div>
          </div>
          <div className={styles.overviewCard}>
            <div className={styles.cardLabel}>Total Cost</div>
            <div className={styles.cardValue}>$0.0023</div>
          </div>
        </div>
      </section>

      {/* Performance Metrics - トグル可能 */}
      <section className={styles.section}>
        <button 
          className={styles.sectionHeader}
          onClick={() => toggleSection('metrics')}
        >
          <h2 className={styles.sectionTitle}>
            <span>Performance Metrics</span>
            <svg 
              className={`${styles.arrow} ${openSections.metrics ? styles.open : ''}`}
              width="12" 
              height="8" 
              viewBox="0 0 12 8"
            >
              <path 
                d="M1 1L6 6L11 1" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
            </svg>
          </h2>
        </button>
        {openSections.metrics && (
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricTitle}>Average Response Time</span>
                <span className={styles.metricValue}>245ms</span>
              </div>
              <div className={styles.metricChart}>
                {/* レスポンスタイムのライチャート */}
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricTitle}>Memory Usage</span>
                <span className={styles.metricValue}>128MB</span>
              </div>
              <div className={styles.metricChart}>
                {/* メモリ使用量のエリアチャート */}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Trace Timeline - トグル可能 */}
      <section className={styles.section}>
        <button 
          className={styles.sectionHeader}
          onClick={() => toggleSection('timeline')}
        >
          <h2 className={styles.sectionTitle}>
            <span>Trace Timeline</span>
            <svg 
              className={`${styles.arrow} ${openSections.timeline ? styles.open : ''}`}
              width="12" 
              height="8" 
              viewBox="0 0 12 8"
            >
              <path 
                d="M1 1L6 6L11 1" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
            </svg>
          </h2>
        </button>
        {openSections.timeline && (
          <div className={styles.timeline}>
            {traces?.map((trace) => (
              <div 
                key={trace.id}
                className={`${styles.timelineItem} ${currentNodeId === trace.id ? styles.active : ''}`}
                onClick={() => handleTraceClick(trace.id)}
              >
                <div className={styles.timelineHeader}>
                  <div className={styles.serviceBadge}>{trace.serviceType}</div>
                  <div className={styles.timeInfo}>
                    <span className={styles.duration}>{trace.duration}ms</span>
                    <span className={styles.time}>{trace.startTime}</span>
                  </div>
                </div>
                <div className={styles.timelineContent}>
                  <div className={styles.traceName}>{trace.name}</div>
                  {trace.details && (
                    <div className={styles.traceDetails}>
                      {trace.details.requestId && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Request ID:</span>
                          <span className={styles.detailValue}>{trace.details.requestId}</span>
                        </div>
                      )}
                      {trace.details.coldStart && (
                        <div className={styles.coldStartBadge}>Cold Start</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Errors & Alerts - トグル可能 */}
      <section className={styles.section}>
        <button 
          className={styles.sectionHeader}
          onClick={() => toggleSection('errors')}
        >
          <h2 className={styles.sectionTitle}>
            <span>Errors & Alerts</span>
            <svg 
              className={`${styles.arrow} ${openSections.errors ? styles.open : ''}`}
              width="12" 
              height="8" 
              viewBox="0 0 12 8"
            >
              <path 
                d="M1 1L6 6L11 1" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
            </svg>
          </h2>
        </button>
        {openSections.errors && (
          <div className={styles.errorList}>
            {/* エラーアイテム */}
          </div>
        )}
      </section>
    </div>
  );
}; 