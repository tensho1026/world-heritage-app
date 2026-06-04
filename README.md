# world-heritage-app

NestJS API using TypeORM and Neon Postgres.

## Setup

```bash
npm install
cp .env.example .env
npm run db:check
npm run start:dev
```

## Scripts

- `npm run db:check` checks the configured Neon connection.
- `npm run lint` runs ESLint.
- `npm test` runs unit tests.
- `npm run build` compiles the NestJS app.
