import React, { memo } from 'react';
import { FCX } from '@/types/types';
import styles from './style.module.scss';
import { Category } from '@/features/workflow/types/types';
import clsx from 'clsx';
import { ThemeToggle } from '../ThemeToggle';
import { useSSEStore } from '../../stores/useSSEStore';
import { useProgressStore } from '../../stores/useProgressStore';
import { useWorkflowStore } from '../../stores/useWorkflowStore';
interface Props {
  title: string;
  onStart: () => void;
  onTitleChange: (title: string) => void;
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const Header: FCX<Props> = memo(({ 
  title, 
  onStart, 
  onTitleChange, 
  categories,
  selectedCategory,
  onCategoryChange,
}) => {
  const { selectedWorkflow } = useWorkflowStore();
  const { connectionStatus } = useSSEStore();
  const { progressBar } = useProgressStore();
  const getStatusDisplay = () => {
    switch (connectionStatus) {
      
      case 'connecting':
        return { text: 'Establishing Connection...', color: 'warning' };
      case 'connected':
        return { text: 'System Active', color: 'success' };
      case 'error':
        return { text: 'Connection Error', color: 'error' };
      default:
        return { text: 'System Status', color: 'neutral' };
    }
  };

  const status = getStatusDisplay();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.titleSection}>
          <div className={styles.mainTitle}>
            <h1>Fake Thesis Generator</h1>
            <div className={clsx(styles.statusBadge, styles[status.color])}>
              <span className={clsx(styles.dot, styles[status.color])} />
              {status.text}
              {connectionStatus === 'connecting' && (
                <div className={styles.loadingDots}>
                  <span>.</span><span>.</span><span>.</span>
                </div>
              )}
            </div>
            <div className={styles.themeToggleWrapper}>
              <ThemeToggle />
            </div>
          </div>
          <p className={styles.description}>
            イベント駆動型サーバーレスアプリケーション
            <span className={styles.divider}>/</span>
            処理の可視化と透明性を重視したデモンストレーションアプリ
          </p>
        </div>

        <div className={styles.inputSection}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="論文のタイトルを入力"
              className={styles.input}
            />
            <select 
              className={styles.select} 
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              <option value="" disabled>カテゴリを選択</option>
              {categories.map(cat => (
                <option key={cat.category_type_en} value={cat.category_type_en}>
                  {cat.category_type_jp}
                </option>
              ))}
            </select>
            <button onClick={onStart} className={styles.button}>
              <svg 
                className={styles.icon}
                width="20" 
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <span>生成開始</span>
            </button>
          </div>
        </div>

        <div className={clsx(
          styles.progressWrapper,
          (connectionStatus === 'connected') && styles.active
        )}>
          {selectedWorkflow?.workflow_id && (
              <span className={styles.workflowId}>ID: {selectedWorkflow.workflow_id}</span>
            )}
          <div className={styles.progressContainer}>
            <div 
              className={clsx(
                styles.progressBar,
                styles[progressBar.status],
              )}
              style={{ 
                '--progress': `${progressBar.percentage}%` 
              } as React.CSSProperties}
            />
          </div>
          <div className={styles.progressInfo}>
            <span className={styles.percentage}>{progressBar.percentage}</span>
            <span className={clsx(
              styles.status,
              styles[progressBar.status],
            )}>
              {progressBar.status}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
});

export default Header; 