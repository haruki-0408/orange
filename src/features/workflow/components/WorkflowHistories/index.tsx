import React, { useEffect, useCallback } from "react";
import { FCX } from "@/types/types";
import styles from "./style.module.scss";
import { WorkflowHistory } from "@/features/workflow/types/types";
import clsx from "clsx";
import { formatJstDistance } from "@/utils/date";
import { useSSEStore } from "../../stores/useSSEStore";
import { useWorkflowStore } from "../../stores/useWorkflowStore";
import { generatePresignedUrl } from "@/app/actions/workflow";
import { mapping } from "@/features/workflow/const/categoryEnToJpMapping";
import { ConnectionStatus } from "@/features/workflow/types/types";

interface Props {
  histories: WorkflowHistory[];
}

// 接続状態に応�たアイコンコンポーネント
const ConnectionStatusIcon = ({ status }: { status: ConnectionStatus }) => {
  switch (status) {
    case "LIVE":
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <circle cx="12" cy="20" r="2" />
        </svg>
      );
    case "CONNECTING":
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      );
    case "ERROR":
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
    default:
      return null;
  }
};

export const WorkflowHistories: FCX<Props> = ({ histories }) => {
  const { connectionStatus } = useSSEStore();
  const { selectedWorkflow, isActiveWorkflow, setSelectedWorkflow, getActiveWorkflowStatus } = useWorkflowStore();

  // ブラウザの戻る/進む操作を検知
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (connectionStatus === "LIVE" || connectionStatus === "CONNECTING") {
        e.preventDefault();
        return;
      }
    };

    const handlePopState = () => {
      if (connectionStatus === "LIVE" || connectionStatus === "CONNECTING") {
        if (confirm("You will lose real-time progress tracking if you go back. Continue?")) {
          window.removeEventListener("beforeunload", handleBeforeUnload);
        } else {
          history.pushState(null, "", window.location.href);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [connectionStatus]);

  const getStatusBadge = useCallback(
    (history: WorkflowHistory) => {

      if (isActiveWorkflow(history.workflow_id)) {
        return (
          <div className={clsx(styles.badge, styles[getActiveWorkflowStatus(history.workflow_id) || "PROCESSING"])}>
            <span className={styles.dot} />
            {getActiveWorkflowStatus(history.workflow_id) || "PROCESSING"}
          </div>
        );
      }

      // 通常のステータス表示
      return (
        <div className={clsx(styles.badge, styles[history.status])}>
          <span className={styles.dot} />
          {history.status.toUpperCase()}
        </div>
      );
    },
    [selectedWorkflow, isActiveWorkflow]
  );

  // 履歴選択時の処理
  const handleHistorySelect = (history: WorkflowHistory) => {
    // 既に選択されている履歴は再選択できないように
    if (selectedWorkflow?.workflow_id === history.workflow_id) return;

    setSelectedWorkflow(history);
  };

  // PDFダウンロード処理
  const handleDownload = async (workflowId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // カード選択イベントの伝播を止める

    try {
      const { url } = await generatePresignedUrl(workflowId);

      // window.openをuseEffectの外で直接使用しない
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download PDF:", error);
    }
  };

  return (
    <div className={styles.historiesWrapper}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h3>Workflow Histories</h3>
          <span className={styles.count}>{histories.length} workflows</span>
        </div>
        {/* <div className={styles.searchBar}>
          <input 
            type="text" 
            placeholder="Search workflows..." 
            className={styles.searchInput}
          />
        </div> */}
      </div>
      <div className={styles.list}>
        {histories.map((history) => (
          <div
            key={`history-${history.workflow_id}`}
            className={clsx(
              styles.historyCard,
              selectedWorkflow?.workflow_id === history.workflow_id && styles.active,
              styles[history.status]
            )}
            onClick={() => handleHistorySelect(history)}
            role="button"
            tabIndex={0}
          >
            <div className={styles.cardHeader}>
              {/* <div className={styles.id}>ID: {history.workflow_id}</div> */}
              <div className={styles.category}>{mapping[history.category as keyof typeof mapping]}</div>
              <div className={styles.timestamp}>{formatJstDistance(history.timestamp)}</div>
            </div>
            <div className={styles.title}>{history.title}</div>
            <div className={styles.cardContent}>
              {history.status === "SUCCESS" && (
                <button
                  className={styles.downloadButton}
                  onClick={(e) => handleDownload(history.workflow_id, e)}
                  title="Download PDF"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>PDF</span>
                </button>
              )}
              {selectedWorkflow?.workflow_id === history.workflow_id &&
                isActiveWorkflow(history.workflow_id) && (
                  <div className={clsx(styles.connectionStatus, styles[connectionStatus || "CONNECTING"])}>
                    <ConnectionStatusIcon status={connectionStatus} />
                    <span>{connectionStatus}</span>
                  </div>
                )}
              {getStatusBadge(history)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
