import React, { useState } from "react";
import { FCX } from "@/types/types";
import styles from "./style.module.scss";
import clsx from "clsx";
import { Modal } from "@/features/workflow/components/Modal";
import { LogGroupResults } from "@/features/workflow/types/types";
import { LogEntry } from "@/features/workflow/types/types";
interface Props {
  // id: string;
  // level: 'error' | 'warning' | 'info';
  // message: string;
  // timestamp: string;
  // service: string;
  // details: string;
  level: string;
  id: string;
  timestamp: string;
  service: string;
  logGroupResults: LogGroupResults;
}

export const LogCard: FCX<Props> = ({
  // level,
  // message,
  // timestamp,
  // service,
  // details,
  // className
  level,
  className,
  id,
  timestamp,
  service,
  logGroupResults
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const headerContent = (
    <div className={styles.modalInfo}>
      <span className={clsx(styles.errorLevel, styles[level])}>{level.toUpperCase()}</span>
      <span className={styles.errorService}>{service}</span>
      <time className={styles.timestamp}>
        {new Date(timestamp).toLocaleString("ja-JP", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        })}
      </time>
    </div>
  );

  return (
    <>
      <div
        className={clsx(styles.errorItem, styles[level], className)}
        onClick={() => setIsModalOpen(true)}
        role="button"
        tabIndex={0}
      >
        <div className={styles.errorHeader}>
          <div className={styles.errorInfo}>
            <span className={clsx(styles.errorLevel, styles[level])}>{level.toUpperCase()}</span>
            <time>{new Date(timestamp).toLocaleTimeString()}</time>
          </div>
          <span className={styles.errorService}>{service}</span>
        </div>
        {/* <p className={styles.errorMessage}>{message}</p>
        <pre className={styles.errorDetails}>
          <code>{details}</code>
        </pre> */}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        headerContent={headerContent}
        className={styles.logModal}
      >
        {/* <div>
          <h3>詳細情報</h3>
          <p>{message}</p>
          <pre>{details}</pre>
        </div> */}
        <div className={styles.logModal}>
          <div className={styles.requestInfo}>
            <div className={styles.requestId}>
              <span className={styles.label}>Request ID:</span>
              <span className={styles.value}>{id}</span>
            </div>
          </div>

          <div className={styles.logTable}>
            <div className={styles.tableHeader}>
              <div className={styles.timestamp}>Timestamp</div>
              <div className={styles.ingestionTime}>Ingestion Time</div>
              <div className={styles.message}>Message</div>
            </div>
            <div className={styles.tableBody}>
              {Object.values(logGroupResults).map((events, logGroupName) =>
                events.map((logEntry: LogEntry, index: number) => (
                  <div key={index} className={styles.logEntry}>
                    <div className={styles.timestamp}>{logEntry.timestamp}</div>
                    <div className={styles.ingestionTime}>{logEntry.ingestionTime}</div>
                    <div className={styles.message}>
                      <pre>{logEntry.message}</pre>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
