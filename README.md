# world-heritage-app

React フロントエンドと NestJS バックエンドをそれぞれ独立して管理するリポジトリです。

世界遺産の英語資料を読み、DeepL訳、英文読み上げ、文脈付き語彙保存、間隔反復、読後クイズ、ハイライト、学習レポートを利用できる個人向け学習アプリです。検索、テーマ別一覧、世界地図にも対応しています。認証はありません。

## 仕様書

- [MVP機能仕様書](docs/product-spec.md)

## 構成

- `frontend`: React + TypeScript + Vite
- `backend`: NestJS + TypeORM + Neon Postgres

## セットアップ

```bash
cd frontend
npm install
cp .env.example .env

cd ../backend
npm install
cp .env.example .env
```

`backend/.env` で次を設定します。

- `DATABASE_URL`: Neon Postgresの接続URL
- `DEEPL_API_KEY`: DeepL APIキー
- `DEEPL_API_BASE_URL`: Developer/Freeでは `https://api-free.deepl.com`
- `WIKIMEDIA_USER_AGENT`: 連絡先を含むWikimedia向けUser-Agent

ChatGPTへの「AIで全文翻訳」は利用者自身のChatGPTをプロンプト付きで開くため、OpenAI APIキーは不要です。

`frontend/.env` では必要に応じて次を変更できます。

- `VITE_API_BASE_URL`: API URL。ローカル開発ではViteの `/api` プロキシを使用するため未指定でも動作します。
- `VITE_MAP_STYLE_URL`: MapLibreで使用する地図スタイルURL。初期値はOpenFreeMapです。

世界地図はMapLibre GL JSで描画し、世界遺産の緯度・経度をクラスタ表示します。背景地図の著作権表示は地図上から削除しないでください。

## DB準備

```bash
cd backend
npm run migration:run
npm run db:check

# UNESCOデータを初回取込・更新する場合
curl -X POST http://localhost:3000/heritage-import
```

## 開発サーバー

```bash
# frontend
cd frontend
npm run dev

# backend
cd backend
npm run start:dev
```

## チェック

```bash
# frontend
cd frontend
npm run lint
npm run build
npm test
npm run test:e2e

# backend
cd ../backend
npm run lint
npm test
npm run build
```

E2Eテストを初めて実行する環境では、事前に `cd frontend && npx playwright install chromium` を実行してください。
