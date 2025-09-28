# Repository Guidelines

## Project Structure & Module Organization
Keep page logic paired with data loaders inside `app/`. Share visual components via `components/`, while hooks live in `hooks/` and context providers in `contexts/`. Typed helpers go in `lib/` or `utils/`. Persist Supabase migrations in `supabase/` and scripts in `scripts/`. Store long-term AI memory flows under `memory/`, Tailwind tokens in `styles/`, and automated tests in `__tests__/`. Favor segment-based layouts and Next.js 15 route handlers to keep server logic isolated from client-only code.

## Build, Test, and Development Commands
Use `npm run dev` for the Next.js dev server against Supabase. Create production bundles with `npm run build` and verify via `npm run start`. Run linting with `npm run lint`. Execute unit suites through `npm run test`, switch to watch mode with `npm run test:watch`, and focus on component suites via `npm run test:components`. Launch Playwright E2E flows using `npm run test:e2e` or cover the full stack via `npm run test:all`. Provision Supabase resources with `npm run setup` and confirm state using `npm run verify-db`.

## Coding Style & Naming Conventions
Write TypeScript with 2-space indentation and single quotes. Use PascalCase for React components (`components/CourseCard.tsx`) and camelCase for hooks (`hooks/useLessonPlan.ts`). Prefer server components by default; wrap client-only modules with `'use client'`. Extend Tailwind themes through `styles/tailwind.config.js` rather than ad-hoc colors. Run `npm run lint` before committing.

## Testing Guidelines
Vitest powers the unit suites in `__tests__/`. Name files `*.test.ts` or `*.test.tsx` and reuse builders from `__tests__/helpers`. Seed data through `__tests__/setup`. Capture coverage changes in `__tests__/TEST_SUMMARY.md`. Clean and re-run E2E environments with `npm run test:e2e:cleanup` and `npm run test:e2e:setup`.

## Commit & Pull Request Guidelines
Follow Conventional Commits such as `feat:`, `fix:`, or `chore:`. Group related changes per commit and describe migrations or breaking updates in commit bodies. For PRs, link specs or issues, list verification commands, and attach UI screenshots when surfaces change. Keep Supabase secrets in `.env.local` and rotate shared credentials after debugging.

## Security & Configuration Tips
Copy `.env.example` to `.env.local`, inject Supabase keys via environment variables, and avoid hard-coding credentials. Restrict admin operations to audited TypeScript scripts in `scripts/` and remove temporary secrets before publishing.
