# backend

NestJS API using TypeORM and Neon Postgres.

## Setup

```bash
npm install
cp .env.example .env
npm run migration:run
npm run db:check
npm run start:dev
```

上記は `backend` ディレクトリ内で実行します。

## Scripts

- `npm run db:check` checks the configured Neon connection.
- `npm run migration:run` applies the learning and translation schema.
- `npm run migration:revert` reverts the latest migration.
- `npm run lint` runs ESLint.
- `npm test` runs unit tests.
- `npm run build` compiles the NestJS app.
