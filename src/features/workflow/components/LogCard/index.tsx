import React, { useState } from "react";
import { FCX } from "@/types/types";
import styles from "./style.module.scss";
import clsx from "clsx";
import { Modal } from "@/features/workflow/components/Modal";
import { LogGroupResults } from "@/features/workflow/types/types";
import { LogEntry } from "@/features/workflow/types/types";
import Image from "next/image";
interface Props {
  stateName: string;
  level: "error" | "warning" | "info";
  id: string;
  timestamp: string;
  service: string;
  logGroupResults: LogGroupResults;
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString)
    .toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    })
    .replace(/\//g, "/")
    .replace(",", "");
};

export const LogCard: FCX<Props> = ({
  level,
  className,
  id,
  timestamp,
  stateName,
  service,
  logGroupResults
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 最初のメッセージを取得
  const firstMessage = Object.values(logGroupResults)[0]?.[0]?.message || "";

  const headerContent = (
    <div className={styles.modalInfo}>
      <div className={styles.cloudwatchHeader}>
        <Image src="/aws/cloudwatch.svg" alt="CloudWatch" width={24} height={24} />
        <span>Cloudwatch Logs</span>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={clsx(styles.logItem, styles[level], className)}
        onClick={() => setIsModalOpen(true)}
        role="button"
        tabIndex={0}
      >
        <div className={styles.logHeader}>
          <div className={styles.topRow}>
            <div className={styles.leftSide}>
              <span className={clsx(styles.logLevel, styles[level])}>{level.toUpperCase()}</span>
            </div>
            <span className={styles.logService}>{service}</span>
            <time className={styles.timestamp}>{formatDateTime(timestamp)}</time>
          </div>
          <div className={styles.middleRow}>
            <span className={styles.logStateName}>{stateName}</span>
          </div>
          <div className={styles.messagePreview}>{firstMessage}</div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        headerContent={headerContent}
        className={styles.logModal}
      >
        <div className={styles.logModal}>
          <div className={styles.requestInfo}>
            <div className={styles.mainInfo}>
              <div className={styles.stateInfo}>
                <span className={styles.label}>State</span>
                <span className={styles.stateName}>{stateName}</span>
              </div>
            </div>
            <div className={styles.metaInfo}>
              <div className={styles.requestId}>
                <span className={styles.label}>Request ID</span>
                <span className={styles.value}>{id}</span>
              </div>
              <div className={styles.timestamp}>
                <span className={styles.label}>Timestamp</span>
                <span className={styles.value}>{formatDateTime(timestamp)}</span>
              </div>
              <div className={styles.logService}>
                <span className={styles.label}>Service</span>
                <span className={styles.value}>{service}</span>
              </div>
              <div className={styles.logLevel}>
                <span className={styles.label}>Level</span>
                <span className={clsx(styles.value, styles[level])}>{level.toUpperCase()}</span>
              </div>
              <div className={styles.logGroup}>
                <span className={styles.label}>Log Group</span>
                <span className={styles.value}>{Object.keys(logGroupResults)[0]}</span>
              </div>
            </div>
          </div>

          <div className={styles.logTable}>
            <div className={styles.tableHeader}>
              <div className={styles.timestamp}>Timestamp</div>
              <div className={styles.ingestionTime}>Ingestion Time</div>
              <div className={styles.message}>Message</div>
            </div>
            <div className={styles.tableBody}>
              {Object.values(logGroupResults)[0]?.map((logEntry: LogEntry, index: number) => (
                <div key={index} className={styles.logEntry}>
                  <div className={styles.timestamp}>{formatDateTime(logEntry.timestamp)}</div>
                  <div className={styles.ingestionTime}>
                    {formatDateTime(logEntry.ingestionTime)}
                  </div>
                  <div className={styles.message}>
                    <pre>{logEntry.message}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};