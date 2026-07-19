# world-heritage-app

React フロントエンドと NestJS バックエンドを npm workspaces で管理するモノレポです。

## 構成

- `frontend`: React + TypeScript + Vite
- `backend`: NestJS + TypeORM + Neon Postgres

## セットアップ

```bash
npm install
cp backend/.env.example backend/.env
```

## 開発サーバー

```bash
# frontend
npm run dev:frontend

# backend
npm run dev:backend
```

## チェック

```bash
npm run lint
npm test
npm run build
```
