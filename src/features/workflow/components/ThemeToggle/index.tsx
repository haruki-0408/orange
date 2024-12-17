import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './style.module.scss';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      className={styles.themeToggle}
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <div className={styles.slider}>
        <SunIcon className={styles.sunIcon} />
        <MoonIcon className={styles.moonIcon} />
        <div className={clsx(styles.thumb, theme === 'dark' && styles.dark)} />
      </div>
    </button>
  );
}; 