import React, { useEffect, memo, useCallback } from 'react';
import { FCX } from '@/types/types';
import styles from './style.module.scss';
import { WorkflowHistory, ConnectionStatus } from '@/features/workflow/types/types';
import clsx from 'clsx';
import { formatJstDistance } from '@/utils/date';
import { useSSEStore } from '../../stores/useSSEStore';

interface Props {
  histories: WorkflowHistory[];
  currentWorkflowId: string | null;
  onSelect: (history: WorkflowHistory) => void;
}

export const WorkflowHistories: FCX<Props> = memo(({ 
  histories, 
  currentWorkflowId,
  onSelect,
}) => {
  const { connectionStatus } = useSSEStore();

  // 進行中のワークフローかどうかを判定
  const isActiveWorkflow = useCallback((history: WorkflowHistory) => {
    return history.status === 'PROCESSING' && history.workflow_id === currentWorkflowId;
  }, [currentWorkflowId]);

  // ブラウザの戻る/進む操作を検知
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (connectionStatus === 'connected' || connectionStatus === 'connecting') {
        e.preventDefault();
        return;
      }
    };

    const handlePopState = () => {
      if (connectionStatus === 'connected' || connectionStatus === 'connecting') {
        if (confirm('You will lose real-time progress tracking if you go back. Continue?')) {
          window.removeEventListener('beforeunload', handleBeforeUnload);
        } else {
          history.pushState(null, '', window.location.href);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [connectionStatus]);

  const getStatusBadge = (history: WorkflowHistory) => {
    // 進行中のワークフローの場合のみLIVE表示
    if (isActiveWorkflow(history)) {
      return (
        <div className={clsx(styles.badge, styles.connection)}>
          <span className={styles.dot} />
          {connectionStatus === 'connected' ? 'LIVE' : 'CONNECTING'}
        </div>
      );
    }

    // それ以外は通常のステータス表示
    return (
      <div className={clsx(styles.badge, styles[history.status])}>
        <span className={styles.dot} />
        {history.status.toUpperCase()}
      </div>
    );
  };

  // 履歴選択時の処理
  const handleHistorySelect = (history: WorkflowHistory) => {
    // 進行中のワークフロー以外は選択不可
    onSelect(history);
  };

  return (
    <div className={styles.historiesWrapper}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h3>Workflow Histories</h3>
          <span className={styles.count}>{histories.length} workflows</span>
        </div>
        <div className={styles.searchBar}>
          <input 
            type="text" 
            placeholder="Search workflows..." 
            className={styles.searchInput}
          />
        </div>
      </div>
      <div className={styles.list}>
        {histories.map((history) => (
          <button
            key={`history-${history.workflow_id}`}
            className={clsx(
              styles.historyCard,
              history.workflow_id === currentWorkflowId && styles.active,
              styles[history.status]
            )}
            onClick={() => handleHistorySelect(history)}
          >
            <div className={styles.cardHeader}>
              <div className={styles.title}>{history.title}</div>
              <div className={styles.timestamp}>
                {formatJstDistance(history.timestamp)}
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.category}>{history.category}</div>
              {getStatusBadge(history)}
            </div>
            <div className={styles.cardFooter}>
              <div className={styles.id}>ID: {history.workflow_id}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

WorkflowHistories.displayName = 'WorkflowHistories';
