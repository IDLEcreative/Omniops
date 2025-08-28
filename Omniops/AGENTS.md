# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router (e.g., `page.tsx`, `layout.tsx`, `api/**/route.ts`).
- `components/`: Reusable UI. Prefer PascalCase (e.g., `ChatWidget.tsx`); group by domain.
- `lib/`: Shared utilities and services (Supabase, OpenAI, scraping helpers).
- `hooks/`: React hooks.
- `__tests__/`, `__mocks__/`: Unit/integration tests and Jest mocks.
- `browser-automation/`: Playwright/Crawlee scripts for scraping/diagnostics.
- `scripts/`: Maintenance scripts (run with `tsx`).
- `public/`, `docs/`, `supabase/`: Static assets, docs, and DB migrations.

## Build, Test, and Development Commands
- `npm run dev`: Start local dev server at `http://localhost:3000`.
- `npm run build` / `npm start`: Production build and start.
- `npm run lint`: ESLint (Next.js + TypeScript rules).
- `npm test`: All Jest tests. `npm run test:unit`, `npm run test:integration`, `npm run test:coverage` for variants.
- `npx playwright test`: Run Playwright tests (ensure server running).
- `npm run check:all`: Dependency check, lint, and type-check.

## Coding Style & Naming Conventions
- TypeScript strict; 2‑space indent; format with Prettier; lint with ESLint (`eslint.config.mjs`).
- Components: PascalCase files; routes: kebab‑case under `app/`.
- Tests: `*.test.ts(x)`/`*.spec.ts(x)`; place under `__tests__/` when possible.
- Imports: use alias `@/` (see `tsconfig.json` paths).

## Testing Guidelines
- Frameworks: Jest (+ jsdom, Testing Library) and Playwright for E2E.
- Coverage: Jest global thresholds ~70% lines/funcs/branches; integration config targets 60–70%.
- Naming: `__tests__/integration/**/*.test.ts(x)` for integration; unit tests alongside code or under `__tests__`.
- Run examples: `npm test`, `npm run test:integration`, `npx playwright test` (with `npm run dev`).

## Commit & Pull Request Guidelines
- Commits: Follow Conventional Commits where possible (`feat:`, `fix:`, `docs:`, `chore:`, `test:`). Example: `feat(chat): add message streaming`.
- PRs: Include purpose, linked issues, test plan/steps, and screenshots for UI. Note any env or migration changes.
- Pre-submit: `npm run check:all` and ensure tests pass locally.

## Security & Configuration Tips
- Copy envs from `.env.local.example` → `.env.local` (do not commit secrets). See also `.env.example`.
- Configure Supabase keys and OpenAI credentials before running integration/E2E tests.
- Be cautious with scraping scripts; respect robots.txt and site policies.

