# 嘘論文生成アプリケーション(フロントエンド)

## 参考ドキュメント
[Miro 構想資料](https://miro.com/app/board/uXjVLuyj9ss=/?share_link_id=568802384893)

## プロジェクトの目的

本プロジェクトは、AIを活用した嘘論文生成プロセスを可視化・制御するためのフロントエンドアプリケーションです。
サーバーレスアーキテクチャで構築されたバックエンドと連携し、以下の機能を提供します：

- **生成プロセスの可視化**: Step Functionsの実行状態をリアルタイムに表示
- **進捗管理**: 各ステップの実行状況をリアルタイムに監視
- **パフォーマンス分析**: 実行時間やリソース使用状況の可視化
- **マルチプレーヤーカーソルの表示**: 複数ユーザーでの同時閲覧感を出しています

## 技術的なハイライト

### 1. リアルタイム通信の最適化
- **SSEによる効率的な進捗監視**
  - 軽量な単方向通信による状態更新
  - 再接続ロジックによる安定性確保
  - バックエンドからのプッシュ通知

- **状態管理の工夫**
  - Zustandによる効率的な状態管理
  - useSWRを活用したデータフェッチ
  - 不要な再レンダリングの防止

### 2. 直感的なUI/UX
- **ReactFlowによるワークフロー表現**
  - カスタムノード・エッジの実装
  - ドラッグ＆ドロップ操作
  - 状態に応じたアニメーション

- **リアルタイムコラボレーション**
  - マルチプレーヤーカーソル同期
  - LiveblocksによるWebSocketの制御
  - プレゼンス管理

### 3. 堅牢なアーキテクチャ
- **Next.js 14の活用**
  - App Routerの採用
  - サーバーコンポーネントの活用
  - 最適化されたビルド

- **型安全性の徹底**
  - TypeScriptによる静的型チェック
  - APIレスポンスの型定義
  - エラーハンドリングの強化

## システムアーキテクチャ

本リポジトリは、下図のフロントエンド部分（Next.jsサーバー）を実装しています。
バックエンドとの通信を担い、ユーザーインターフェースを提供します。

![SSE進捗通知システム](./sse.jpg)

### SSE進捗通知システム

Server-Sent Events (SSE)を活用して、ワークフローの進捗状態をリアルタイムに更新する仕組みを実装しています：

1. **SSEManagerの実装**
   ```typescript
   // src/lib/sse/SSEManager.ts
   export class SSEManager {
     private eventSource: EventSource | null = null;
     private reconnectAttempts = 0;
     
     connect(workflowId: string) {
       this.eventSource = new EventSource(`/api/sse/${workflowId}`);
       this.setupEventHandlers();
     }
     
     private setupEventHandlers() {
       // 進捗通知イベントの処理
       this.eventSource?.addEventListener('progress', this.handleProgress);
       // 接続状態の監視
       this.eventSource?.addEventListener('error', this.handleError);
     }
   }
   ```

2. **進捗状態の管理**
   ```typescript
   // src/features/workflow/stores/useProgressStore.ts
   export const useProgressStore = create<ProgressStore>((set) => ({
     progress: {},
     updateProgress: (data: ProgressData) => 
       set((state) => ({
         progress: {
           ...state.progress,
           [data.state_name]: data
         }
       }))
   }));
   ```

3. **UIコンポーネントとの連携**
   ```typescript
   // src/features/workflow/hooks/useWorkflowProgress.ts
   export const useWorkflowProgress = (workflowId: string) => {
     const sseManager = useMemo(() => new SSEManager(), []);
     const updateProgress = useProgressStore((state) => state.updateProgress);
     
     useEffect(() => {
       sseManager.connect(workflowId);
       return () => sseManager.disconnect();
     }, [workflowId]);
   };
   ```

## プロジェクト構造

本プロジェクトは、以下のような独自のモジュール分割アプローチで設計されています：

```
src/
├── features/          # 機能モジュール
│   ├── workflow/      # メイン機能：ワークフロー管理
│   │   ├── components/  # 機能固有のコンポーネント
│   │   │   ├── WorkflowVisualizer/  # ワークフロー表示
│   │   │   ├── TracesDashboard/     # トレース情報
│   │   │   └── WorkflowHistories/   # 実行履歴
│   │   ├── hooks/      # カスタムフック
│   │   ├── stores/     # 状態管理
│   │   ├── services/   # APIサービス
│   │   └── types/      # 型定義
│   └── room/         # マルチプレーヤーカーソルに関する機能
├── components/        # 共通コンポーネント
│   ├── ui-mass/      # 複合コンポーネント
│   └── ui-parts/     # 基本コンポーネント
├── lib/              # 共通ユーティリティ
└── styles/           # グローバルスタイル
```

### モジュール構成の特徴

1. **機能ベースの分割**
   - メイン機能とサポート機能の明確な分離
   - 機能ごとの完全な独立性
   - 依存関係の最小化

2. **コンポーネント階層**
   - 複合/基本コンポーネントの明確な分離
   - 再利用性を考慮した設計
   - 責務の明確な定義

3. **共通基盤**
   - 通信機能の集約
   - ユーティリティの共有
   - スタイルの一元管理

## 技術スタック

### フロントエンド基盤
- **Next.js 14**: Reactフレームワーク
- **TypeScript**: 静的型付け
- **TailwindCSS**: スタイリング
- **SCSS Modules**: コンポーネント別スタイリング

### 状態管理・データフェッチ
- **Zustand**: 軽量な状態管理
- **useSWR**: データフェッチング

### UI/UXライブラリ
- **ReactFlow**: ワークフローの可視化
- **Liveblocks**: リアルタイムコラボレーション

### 開発ツール
- **ESLint**: コード品質管理
- **Prettier**: コードフォーマット
- **PostCSS**: CSSの最適化

## セットアップガイド

### 開発環境のセットアップ
```bash
# パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev
```

### 環境変数の設定

`.env`ファイルを作成し、必要な環境変数を設定してください。詳細は`.env.sample`を参照してください。
