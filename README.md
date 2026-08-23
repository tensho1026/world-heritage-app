# world-heritage-app

React フロントエンドと NestJS バックエンドをそれぞれ独立して管理するリポジトリです。

世界遺産の英語資料を読み、DeepL訳、英文読み上げ、文脈付き語彙保存、暗記カード、読了記録を利用できる個人向け学習アプリです。認証はありません。

## 仕様書

- [MVP機能仕様書](docs/product-spec.md)

## 構成

- `frontend`: React + TypeScript + Vite
- `backend`: NestJS + TypeORM + Neon Postgres

## セットアップ

```bash
cd frontend
npm install

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
