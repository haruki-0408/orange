<div align="center">
  <img src="logo.png" alt="Fake Thesis Generator" width="600" />

  <h1>嘘論文生成アプリケーション</h1>
  <p><i>生成AIを活用した論文生成 & 可視化システム</i></p>

  <p>
    <a href="https://nextjs.org">
      <img src="https://img.shields.io/badge/Next.js-14.0-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    </a>
    <a href="https://www.typescriptlang.org">
      <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
    </a>
    <a href="https://aws.amazon.com/serverless/">
      <img src="https://img.shields.io/badge/AWS-Serverless-orange?style=for-the-badge&logo=amazon-aws" alt="AWS Serverless" />
    </a>
    <a href="https://redis.io">
      <img src="https://img.shields.io/badge/Redis-Pub%2FSub-red?style=for-the-badge&logo=redis" alt="Redis" />
    </a>
  </p>
  <p>
    <a href="https://liveblocks.io">
      <img src="https://img.shields.io/badge/Realtime-Liveblocks-purple?style=for-the-badge" alt="Liveblocks" />
    </a>
    <a href="https://reactflow.dev">
      <img src="https://img.shields.io/badge/Visualization-React%20Flow-cyan?style=for-the-badge" alt="React Flow" />
    </a>
    <a href="https://tailwindcss.com">
      <img src="https://img.shields.io/badge/CSS-Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" />
    </a>
  </p>
  <p>
    <a href="https://vercel.com">
      <img src="https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel" alt="Vercel" />
    </a>
    <img src="https://img.shields.io/badge/Status-Beta-yellow?style=for-the-badge" alt="Status" />
  </p>

  <p>
    <a href="https://orange-webp.vercel.app/">デモを試す</a>
    ·
    <a href="https://miro.com/app/board/uXjVLuyj9ss=/?share_link_id=568802384893">構想資料</a>
    ·
    <a href="https://github.com/haruki-0408/melon">バックエンド</a>
  </p>
</div>

---

## 📖 はじめに

本プロジェクトは、転職活動用に用意した生成AIを活用した嘘の内容の論文を生成 & 可視化するためのフロントエンドに関する機能リポジトリです。

<div align="center">
  <h3>🔄 開発プロセス</h3>
  <p>
    <code>アプリの構想</code> ▶︎ 
    <code>アーキテクチャ設計</code> ▶︎ 
    <code>開発・実装</code> ▶︎ 
    <code>デプロイ</code>
  </p>
</div>

上記一貫した能力があることを表現するために作成しましたので、もしよろしければ[構想資料](https://miro.com/app/board/uXjVLuyj9ss=/?share_link_id=568802384893)と[サーバーサイド・インフラ](https://github.com/haruki-0408/melon)のリポジトリも合わせてご覧くださいませ。

## ✨ プロジェクトの目的

サーバーレスアーキテクチャで構築されたバックエンドと連携し、以下の機能を提供します：

### 🎯 主要機能

- **ユーモアのある嘘論文の生成**
  - ユーザーが入力したタイトルとカテゴリから嘘の内容の論文を生成
  - 生成AIを活用したPDF形式での出力
  - ダウンロード機能の提供

- **生成プロセスの可視化**
  - Redisを用いたSSE接続による状態管理
  - ReactFlowを活用したStep Functions実行状態のリアルタイム表示
  - 直感的なワークフロー進捗の把握

- **パフォーマンス分析**
  - X-ray, CloudWatch Logsを用いた実行時間の計測
  - リソース使用状況の可視化
  - 包括的なログ・モニタリング機能

- **マルチプレーヤー機能**
  - リアルタイムカーソル同期
  - 複数ユーザーでの同時閲覧体験
  - Liveblocksを活用したプレゼンス管理

## 🛠 技術的なハイライト

### 1. リアルタイム通信の最適化

#### SSEによる効率的な進捗監視
- 軽量な単方向通信による状態更新
- Redis Pub/Subによるスケーラブルな通知
- 再接続ロジックによる安定性確保
- バックエンドからのプッシュ通知

#### 状態管理の工夫
- Zustandによる効率的な状態管理
- useSWRを活用したデータフェッチ
- 不要な再レンダリングの防止

### 2. 直感的なUI/UX

#### ReactFlowによるワークフロー表現
- カスタムノード・エッジの実装
- 状態に応じたオリジナルアニメーション
- 進行状態を伝えるプログレスバーの表示

#### モニタリングパフォーマンス測定
- X-ray, CloudWatch Logsによる実行時間の可視化
- リソース使用状況のリアルタイム監視
- マルチプレーヤーカーソル同期
- LiveblocksによるWebSocket制御

### 3. 堅牢なアーキテクチャ

#### Next.js 14の活用
- App Routerの採用
- サーバーコンポーネントの活用(ServerActions)
- 最適化されたビルド

#### 型安全性の徹底
- TypeScriptによる静的型チェック
- APIレスポンスの型定義
- エラーハンドリングの強化

## 🌐 システムアーキテクチャ

本リポジトリは、下図のフロントエンド部分（Next.jsサーバー on Vercel）を実装しています。
バックエンドとの通信を担い、ユーザーインターフェースを提供します。

<div align="center">
  <img src="./sse.jpg" alt="SSE進捗通知システム" width="800" />
</div>

### SSE進捗通知システム

このプロジェクトは、Server-Sent Events (SSE)を活用して、ワークフローの進捗をリアルタイムで管理・可視化するための高スケーラブルなアーキテクチャを実現しています。

<div align="center">
  <img src="./redis.png" alt="Redis Pub/Subを用いたSSE接続管理" width="800" />
  <p><i>Redis Pub/Subを用いたSSE接続管理</i></p>
</div>

### 主要機能と技術

#### ▼ Next.js App Router
- 動的APIルート: Next.jsの動的ルーティング機能を活用
- Node.jsランタイム: サーバーサイドレンダリングと高い応答性を実現

#### 👀 Server-Sent Events (SSE)
- SSEストリーム: クライアントとの長時間接続を確立
- イベント処理: 接続初期化、メッセージ処理、切断時のクリーンアップ

#### 🚨 Redis Pub/Sub
- スケーラブルな通知システム
- イベントプロデューサー/コンシューマーの分離
- サーバーレス環境での最適化

## 📦 プロジェクト構造

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

## 🔧 技術スタック

### フロントエンド基盤
- **Next.js 14**: Reactフレームワーク
- **TypeScript**: 静的型付け
- **TailwindCSS**: スタイリング
- **SCSS Modules**: コンポーネント別スタイリング

### SSE接続管理
- **Redis**: Pub/Subによるスケーラブルな通知
- **Server-Sent Events**: リアルタイム通信

### 状態管理・データフェッチ
- **ServerActions**: サーバーサイドでのデータ取得
- **Zustand**: 量な状態管理
- **useSWR**: データフェッチング

### UI/UXライブラリ
- **ReactFlow**: ワークフローの可視化
- **Liveblocks**: リアルタイムコラボレーション

### 開発ツール
- **ESLint**: コード品質管理
- **Prettier**: コードフォーマット
- **PostCSS**: CSSの最適化

## 🚀 セットアップガイド

### 環境変数の設定

`.env.local`ファイルを作成し、必要な環境変数を設定してください。詳細は`.env.sample`を参照してください。

### 開発環境のセットアップ

```bash
# パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev
```

## 📝 コード例

### SSE接続の実装例

```typescript
// /lib/sse/SSEClient.ts
static async subscribeRedis(workflowId: string, controller: ReadableStreamDefaultController): Promise<void> {
  this.redisSubscribe.subscribe(workflowId, (error) => {
    if (error) {
      console.error('Failed to subscribe:', error);
    }
  });

  this.redisSubscribe.on('message', (channel, message) => {
    controller.enqueue(new TextEncoder().encode(`data: ${message}\n\n`));
  });
}

static async publishProgress(workflowId: string, data: ProgressData): Promise<void> {
  await this.redisPublish.publish(workflowId, JSON.stringify(data));
}
```

クライアント接続を確立し管理するSSE APIルートを定義。
```typescript
// /app/api/sse/[workflow_id]/route.ts

export async function GET(req: NextRequest, { params }: { params: { workflow_id: string } }) {
  const { workflow_id } = params;

  const stream = new ReadableStream({
    start(controller) {
      SSEClient.subscribeRedis(workflow_id, controller);
      req.signal.addEventListener('abort', () => {
        SSEClient.unsubscribeRedis(workflow_id);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

ワークフロー進捗更新を発行するためのAPIエンドポイント。
```typescript
// /app/api/notify/route.ts

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { workflow_id, status, state_name } = json;

    const progress: ProgressData = {
      execution_id: json.execution_id,
      status,
      state_name,
      timestamp: new Date().toISOString(),
    };

    await SSEClient.publishProgress(workflow_id, progress);
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Error in /api/notify:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


```

## 🔍 主要な実装ポイント

### リアルタイム通信の最適化

- **SSE接続の効率化**
  - 再接続ロジックの実装
  - エラーハンドリングの強化
  - メモリリークの防止

- **状態管理の最適化**
  - Zustandによるグローバルステート
  - useSWRによるキャッシュ制御
  - 不要な再レンダリングの抑制

### UI/UXの改善

- **ワークフロー可視化**
  - カスタムノードの実装
  - アニメーションの最適化
  - レスポンシブ対応

- **パフォーマンス監視**
  - メトリクスの可視化
  - エラー検知と通知
  - ログ収集の効率化


## 📫 フィードバック

問題の報告や提案がございましたら、以下までご連絡くださいませ。

- haru0408g1@gmail.com

最後まで閲覧していただきありがとうございます。

