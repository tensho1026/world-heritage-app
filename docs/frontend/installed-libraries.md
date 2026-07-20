# Frontend Libraries

The frontend uses npm. Install all dependencies with:

```bash
cd frontend
npm install
npx playwright install chromium
```

## Runtime dependencies

| Library         | Package                 | Purpose                                                 |
| --------------- | ----------------------- | ------------------------------------------------------- |
| React Router    | `react-router-dom`      | Client-side routing and navigation                      |
| React Query     | `@tanstack/react-query` | Server-state fetching, caching, and synchronization     |
| React Hook Form | `react-hook-form`       | Performant form state and validation integration        |
| Zod             | `zod`                   | Runtime schema validation and TypeScript type inference |
| Axios           | `axios`                 | HTTP client for API requests                            |
| Zustand         | `zustand`               | Lightweight client-side state management                |
| Day.js          | `dayjs`                 | Date parsing, formatting, and manipulation              |
| Radix UI        | `radix-ui`              | Accessible, unstyled UI primitives                      |
| Lodash          | `lodash`                | General-purpose collection and object utilities         |

## Styling and development dependencies

| Library         | Package                                                                              | Purpose                                                |
| --------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| Tailwind CSS    | `tailwindcss`, `@tailwindcss/vite`                                                   | Utility-first styling integrated with Vite             |
| Testing Library | `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` | Component tests focused on user behavior               |
| Vitest          | `vitest`, `jsdom`                                                                    | Unit and component test runner with a browser-like DOM |
| Playwright      | `@playwright/test`                                                                   | End-to-end browser testing                             |
| ESLint          | `eslint` and the existing React/TypeScript plugins                                   | Static code analysis                                   |
| Prettier        | `prettier`                                                                           | Consistent source formatting                           |
| Lodash types    | `@types/lodash`                                                                      | TypeScript declarations for Lodash                     |

## Available commands

Run these commands from `frontend`:

```bash
npm run dev
npm run build
npm run lint
npm run format
npm run format:check
npm test
npm run test:watch
npm run test:e2e
```

Tailwind CSS is enabled through the Vite plugin and imported in `src/index.css`.
Vitest uses `jsdom` and loads Testing Library matchers from `src/test/setup.ts`.
Playwright is configured for Chromium in `playwright.config.ts`.

## Repository-wide Git hooks

Husky is installed at the repository root instead of inside `frontend`. The
root `pre-commit` hook runs both the frontend and backend lint commands:

```bash
npm run lint
```

After cloning the repository, initialize the hook by running `npm install` at
the repository root.
