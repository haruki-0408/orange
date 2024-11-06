export default class WebSocketClient {
    private socket: WebSocket | null = null;
    private url: string;
    private onMessageCallback: (message: string) => void;
  
    constructor(url: string, onMessageCallback: (message: string) => void) {
      this.url = url;
      this.onMessageCallback = onMessageCallback;
    }
  
    // WebSocket接続の初期化
    connect() {
      if (this.socket) return; // 既に接続している場合は再接続しない
  
      this.socket = new WebSocket(this.url);
  
      this.socket.onopen = () => {
        console.log('WebSocket connection established');
      };
  
      this.socket.onmessage = (event) => {
        this.onMessageCallback(event.data);
      };
  
      this.socket.onclose = () => {
        console.log('WebSocket connection closed');
      };
  
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    }
  
    // メッセージ送信
    sendMessage(message: string) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(message);
      }
    }
  
    // WebSocket接続を切断
    close() {
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
    }
  }
  