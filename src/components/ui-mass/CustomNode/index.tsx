'use client'
import React, { useState } from 'react';
import { NodeProps } from 'reactflow';
import styles from './style.module.scss';

export const CustomNode = ({ data }: NodeProps<{ title: string; description: string; icon?: string; status: string; code: string }>) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.customNodeWrapper}>
      <div className={styles.customNode}>
        <div className={styles.header}>
          {data.icon && <div className={styles.icon}>{data.icon}</div>}
          <div className={styles.titleArea}>
            <h3 className={styles.title}>{data.title}</h3>
            <p className={styles.description}>{data.description}</p>
          </div>
        </div>
        <hr className={styles.separator} />
        <button className={styles.toggleButton} onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? 'Hide Code' : 'Show Code'}
        </button>
        {isOpen && (
          <pre className={styles.codeBlock}>
            <code>{data.code}</code>
          </pre>
        )}
        <div className={`${styles.badge} ${styles[data.status.toLowerCase()]}`}>{data.status}</div>
      </div>
    </div>
  );
};


export default CustomNode;
