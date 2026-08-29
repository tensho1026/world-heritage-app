# world-heritage-app

React フロントエンドと NestJS バックエンドをそれぞれ独立して管理するリポジトリです。

世界遺産の英語資料を読み、DeepL訳、英文読み上げ、文脈付き語彙保存、間隔反復、読後クイズ、ハイライト、学習レポートを利用できる個人向け学習アプリです。テーマ別探索、読了状況を色分けする世界地図、歴史・登録年タイムライン、ディクテーション、英作文、自分で設定する月間チャレンジにも対応しています。認証はありません。

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
- `LIBRETRANSLATE_URL`: 世界遺産記事を事前翻訳するLibreTranslateのURL
- `LIBRETRANSLATE_API_KEY`: LibreTranslate側でAPIキーを要求する場合のみ設定

ChatGPTへの「AIで全文翻訳」は利用者自身のChatGPTをプロンプト付きで開くため、OpenAI APIキーは不要です。

`frontend/.env` では必要に応じて次を変更できます。

- `VITE_API_BASE_URL`: API URL。ローカル開発ではViteの `/api` プロキシを使用するため未指定でも動作します。
- `VITE_MAP_STYLE_URL`: MapLibreで使用する地図スタイルURL。初期値はOpenFreeMapです。
- `VITE_COUNTRY_GEOJSON_URL`: 国別読了状況の塗り分けに使うGeoJSON。初期値はNatural Earth由来のgeo-countriesです。

世界地図はMapLibre GL JSで描画し、世界遺産の緯度・経度をクラスタ表示します。国境GeoJSONと背景地図の著作権表示は地図上から削除しないでください。

## DB準備

```bash
cd backend
npm run migration:run
npm run db:check

# UNESCOデータを初回取込・更新する場合
curl -X POST http://localhost:3000/heritage-import

# LibreTranslateを起動した状態で、未翻訳・原文変更分をDBへ保存
cd backend
npm run translate:heritages
```

記事の日本語訳は表示時に外部APIへ送信せず、DBの保存済み訳を使用します。
`translate:heritages` は1件ごとに保存されるため中断後も再開でき、UNESCOの
英語原文が変わった項目だけを再翻訳します。単語・選択範囲の翻訳用DeepL連携は
引き続き利用できます。

## 開発サーバー

リポジトリのルートから、フロントエンドとバックエンドを同時に起動できます。

```bash
npm run dev
```

フロントエンドは `http://localhost:5173`、バックエンドは
`http://localhost:3000` で起動します。終了するときは `Ctrl+C` を押してください。

個別に起動する場合は次のコマンドを使用します。

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
