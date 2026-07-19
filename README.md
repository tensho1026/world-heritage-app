# world-heritage-app

React フロントエンドと NestJS バックエンドをそれぞれ独立して管理するリポジトリです。

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

# backend
cd ../backend
npm run lint
npm test
npm run build
```
