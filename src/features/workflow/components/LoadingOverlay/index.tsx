import { FCX } from '@/types/types';
import styles from './style.module.scss';
import clsx from 'clsx';

export const LoadingOverlay: FCX = ({ className }) => {
  return (
    <div className={clsx(styles.overlay, className)}>
      <div className={styles.content}>
        <div className={styles.hexagon} />
        <span className={styles.text}>Loading...</span>
      </div>
    </div>
  );
};