'use client'
import React from 'react';
import { FCX } from '@/types/types';
import styles from './style.module.scss';

interface Props {
  title: string;
  onStart: () => void;
  onTitleChange: (title: string) => void;
}

const CATEGORIES = [
  { value: 'technology', label: '技術・工学' },
  { value: 'science', label: '自然科学' },
  { value: 'medical', label: '医学・生命科学' },
  { value: 'social', label: '社会科学' },
  { value: 'humanities', label: '人文科学' },
];

export const Header: FCX<Props> = ({ title, onStart, onTitleChange }) => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.titleSection}>
          <div className={styles.mainTitle}>
            <h1>嘘論文生成器</h1>
            <div className={styles.statusBadge}>
              <span className={styles.dot} />
              System Active
            </div>
          </div>
          <p className={styles.description}>
            イベント駆動型サーバーレスアプリケーション
            <span className={styles.divider}>/</span>
            処理の可視化と透明性の実現
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
            <select className={styles.select} defaultValue="">
              <option value="" disabled>カテゴリを選択</option>
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
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
      </div>
    </header>
  );
}; 