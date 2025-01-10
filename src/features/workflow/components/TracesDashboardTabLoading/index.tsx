import { FCX } from '@/types/types';
import { LoadingSpinner } from '@/components/ui-parts/LoadingSpinner';
import styles from './style.module.scss';
import clsx from 'clsx';

interface Props {
  message: string;
  showSpinner?: boolean;
}

export const TracesDashboardTabLoading: FCX<Props> = ({ 
  message, 
  showSpinner = true,
  className 
}) => (
  <div className={clsx(styles.loading, className)}>
    {showSpinner && <LoadingSpinner size="medium" />}
    <span className={clsx(!showSpinner && styles.messageOnly)}>{message}</span>
  </div>
); 