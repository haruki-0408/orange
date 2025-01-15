import { useEffect } from 'react';
import { useMultiPlayerCursorStore } from '../../../stores/multiPlayerCursorStore';
import WebSocketClient from '../../../lib/websocket/WebSocketClient';

const useWebsocket = (url: string) => {
  const setConnectionStatus = useMultiPlayerCursorStore((state) => state.setConnectionStatus);
  const updateCursor = useMultiPlayerCursorStore((state) => state.updateCursor);

  useEffect(() => {
    // WebSocketClientインスタンスの作成
    const socket = new WebSocketClient(url, (message: string) => {
      // メッセージを受信したらカーソル位置を更新
      const { x, y } = JSON.parse(message);
      updateCursor(x, y);
    });

    // WebSocket接続の開始
    socket.connect();

    // コンポーネントがアンマウントされた際にWebSocket接続を切断
    return () => {
      socket.close();
      setConnectionStatus(false); // 接続状態を更新
    };
  }, [url, setConnectionStatus, updateCursor]);
};

export default useWebsocket;
