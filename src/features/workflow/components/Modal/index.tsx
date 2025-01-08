import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FCX } from '@/types/types';
import styles from './style.module.scss';
import clsx from 'clsx';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Modal: FCX<Props> = ({
  isOpen,
  onClose,
  title,
  headerContent,
  children,
  className
}) => {
  const { theme } = useTheme();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isOpen) {
      // モーダルが開いたときにbodyのスクロールを禁止
      document.body.style.overflow = 'hidden';
      // スクロールバーの幅だけ右にずれるのを防ぐためのパディングを追加
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      // モーダルが閉じたときにスクロールを再有効化
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className={styles.overlay} 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      data-theme={theme} 
    >
      <div 
        className={clsx(styles.content, className)} 
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.headerContent}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {headerContent}
          </div>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className={styles.body}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}; 