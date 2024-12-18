export const getSessionId = (): string => {
  // サーバーサイドでの実行時はnullを返す
  if (typeof window === 'undefined') {
    return '';
  }

  const storageKey = 'session_id';
  let sessionId = sessionStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
}; 