import React, { useState } from 'react';
import { FCX } from '@/types/types';
import styles from './style.module.scss';
import { Category } from '@/features/workflow/types/types';
import clsx from 'clsx';
import { ThemeToggle } from '../ThemeToggle';
import { useSSEStore } from '../../stores/useSSEStore';
import { useProgressStore } from '../../stores/useProgressStore';
import { useWorkflowStore } from '../../stores/useWorkflowStore';
import Image from 'next/image';
import Link from 'next/link';

interface Props {
  title: string;
  onStart: () => void;
  onTitleChange: (title: string) => void;
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const Header: FCX<Props> = ({ 
  title, 
  onStart, 
  onTitleChange, 
  categories,
  selectedCategory,
  onCategoryChange,
  
}) => {
  const { selectedWorkflow, isActiveWorkflow } = useWorkflowStore();
  const { connectionStatus } = useSSEStore();
  const { progressBar } = useProgressStore();
  const [isStarting, setIsStarting] = useState(false);

  // ワークフロー開始処理
  const handleStart = async () => {
    if (isStarting) return; // 既に開始処理中なら何もしない
    
    setIsStarting(true);
    try {
      await onStart();
    } catch (error) {
      console.error('Failed to start workflow:', error);
    } finally {
      setIsStarting(false);
    }
  };

  // 開始ボタンの無効化条件
  const isStartDisabled = 
    isStarting || 
    !title || 
    !selectedCategory || 
    connectionStatus === 'CONNECTING';

  const getStatusDisplay = () => {
    switch (connectionStatus) {
      
      case 'CONNECTING':
        return { text: 'Establishing Connection...', color: 'warning' };
      case 'LIVE':
        return { text: 'System Active', color: 'success' };
      case 'ERROR':
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
              {connectionStatus === 'CONNECTING' && (
                <div className={styles.loadingDots}>
                  <span>.</span><span>.</span><span>.</span>
                </div>
              )}
            </div>
            <div className={styles.actions}>
              <div className={styles.githubLinks}>
                <Link 
                  href="https://github.com/haruki-0408/orange"
                  target="_blank"
                  className={styles.githubLink}
                  title="フロントエンドリポジトリ"
                >
                  <Image 
                    src="/github-mark.svg" 
                    alt="GitHub" 
                    width={20} 
                    height={20} 
                  />
                  <span>Frontend</span>
                </Link>
                <Link 
                  href="https://github.com/haruki-0408/melon"
                  target="_blank"
                  className={styles.githubLink}
                  title="サーバーレス・インフラリポジトリ"
                >
                  <Image 
                    src="/github-mark.svg" 
                    alt="GitHub" 
                    width={20} 
                    height={20} 
                  />
                  <span>Backend</span>
                </Link>
              </div>
              <div className={styles.themeToggleWrapper}>
                <ThemeToggle />
              </div>
            </div>
          </div>
          <p className={styles.description}>
            イベント駆動型サーバーレスアーキテクチャ
            <span className={styles.divider}>/</span>
            処理の可視化と透明性を重視したワークフローアプリケーション
          </p>
        </div>

        <div className={styles.exampleSection}>
          <div className={styles.title}>使い方</div>
          <div className={styles.examples}>
            <div className={styles.example}>
              <strong data-step="1">生成すると面白そうな嘘の内容の論文タイトルを入力</strong>
              <span className={styles.note}>例: 「野菜の光合成を使用した永久機関の開発」など</span>
            </div>
            <div className={styles.example}>
              <strong data-step="2">カテゴリを選択</strong>
              <span className={styles.note}>タイトルに応じたカテゴリを選択「新技術開発」など</span>
            </div>
            <div className={styles.step}>
              <strong data-step="3">生成開始ボタンを押すと論文生成がリアルタイムで進行します</strong>
            </div>
            <div className={styles.step}>
              <strong data-step="4">生成完了後 「Workflow Histories」からPDFダウンロードボタンを押して閲覧</strong>
            </div>
            <div className={styles.example}>
              <strong data-step="5">さらに「Result Dashboard」から論文の生成結果に関するログ&パフォーマンスを確認</strong>
              <span className={styles.note}>「Logs」タブにおける全てのログ(Collectiong logs ⚪︎/⚪︎)が収集されてから「Total Duration」と「Timeline」&「Metrics」タブが表示されます。
              「Logs」タブ内でCloudwatch Logsのログを読み取っており生成が終了してから反映されるまで時間(数分)がかかることがございます。その際は「Refresh」ボタンを押して
              ログの取得状況を更新してください。</span>
            </div>
          </div>
        </div>

        <div className={styles.inputSection}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="論文のタイトルを入力"
              className={styles.input}
              disabled={isStarting}
            />
            <select 
              className={styles.select} 
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              disabled={isStarting}
            >
              <option value="" disabled>カテゴリを選択</option>
              {categories.map(cat => (
                <option key={cat.category_type_en} value={cat.category_type_en}>
                  {cat.category_type_jp}
                </option>
              ))}
            </select>
            <button 
              onClick={handleStart} 
              className={clsx(styles.button, isStartDisabled && styles.disabled)}
              disabled={isStartDisabled}
            >
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
              <span>{isStarting ? '開始中...' : '生成開始'}</span>
            </button>
          </div>
        </div>

        <div className={clsx(
          styles.progressWrapper,
          ((selectedWorkflow && isActiveWorkflow(selectedWorkflow?.workflow_id) && connectionStatus === 'LIVE') || progressBar.status === 'SUCCESS' || progressBar.status === 'FAILED') && styles.active
        )}>
          {selectedWorkflow?.workflow_id && (
              <span className={clsx(
                styles.workflowId,
                styles[progressBar.status],
              )}>ID: {selectedWorkflow.workflow_id}</span>
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
};
