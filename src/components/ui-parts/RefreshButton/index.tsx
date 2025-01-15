import { FCX } from '@/types/types';
import styles from './style.module.scss';
import clsx from 'clsx';

interface Props {
  onClick: () => void;
  isLoading?: boolean;
  text?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary';
}

export const RefreshButton: FCX<Props> = ({ 
  onClick, 
  isLoading = false,
  text = 'Refresh',
  size = 'medium',
  variant = 'primary',
  className 
}) => {
    return (
        <button
            className={clsx(
                styles.refreshButton,
      styles[size],
      styles[variant],
      className
    )}
    onClick={onClick}
    disabled={isLoading}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.icon}
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
        </svg>
        <span>{text}</span>
      </button>
    );
}; 