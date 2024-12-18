import React, { useEffect, memo } from 'react';
import { FCX } from '@/types/types';
import styles from './style.module.scss';
import { WorkflowHistory, ConnectionStatus } from '@/features/workflow/types/types';
import clsx from 'clsx';
import { formatJstDistance } from '@/utils/date';

interface Props {
  histories: WorkflowHistory[];
  currentWorkflowId: string | null;
  onSelect: (history: WorkflowHistory) => void;
  connectionStatus: ConnectionStatus;
}

export const WorkflowHistories: FCX<Props> = memo(({ 
  histories, 
  currentWorkflowId,
  onSelect,
  connectionStatus
}) => {
  // 無効な履歴データをフィルタリング
  const validHistories = histories.filter(
    (history): history is WorkflowHistory & { workflow_id: string } => 
      typeof history.workflow_id === 'string' && history.workflow_id.length > 0
  );

  // ブラウザの戻る/進む操作を検知
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (connectionStatus === 'connected' || connectionStatus === 'connecting') {
        e.preventDefault();
        e.returnValue = 'You will lose real-time progress tracking if you leave. Are you sure?';
        return e.returnValue;
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

  const handleHistorySelect = (history: WorkflowHistory) => {
    if (
      (connectionStatus === 'connected' || connectionStatus === 'connecting') &&
      history.workflow_id !== currentWorkflowId
    ) {
      if (confirm('You will lose real-time progress tracking if you switch to another history. Continue?')) {
        onSelect(history);
      }
    } else {
      onSelect(history);
    }
  };

  const getStatusBadge = (history: WorkflowHistory) => {
    const isCurrentWorkflow = history.workflow_id === currentWorkflowId;
    
    // SSE接続ステータスバッジ (現在選択中のワークフローのみ)
    if (isCurrentWorkflow && (connectionStatus === 'connected' || connectionStatus === 'connecting')) {
      return (
        <div className={clsx(styles.badge, styles.connection)}>
          <span className={styles.dot} />
          {connectionStatus === 'connected' ? 'LIVE' : 'CONNECTING'}
        </div>
      );
    }

    // 通常の進捗ステータスバッジ
    return (
      <div className={clsx(styles.badge, styles[history.status])}>
        <span className={styles.dot} />
        {history.status.toUpperCase()}
      </div>
    );
  };

  return (
    <div className={styles.historiesWrapper}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h3>Workflow Histories</h3>
          <span className={styles.count}>{validHistories.length} workflows</span>
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
        {validHistories.map((history) => (
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
