# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project: WBMPE Rev (Nuxt 4 + Nitro server)

Common commands (pnpm recommended)
- Install deps
  - pnpm install
- Dev server (http://localhost:3000)
  - pnpm dev
- Build production
  - pnpm build
- Preview production build
  - pnpm preview
- Lint (ESLint flat config via .nuxt)
  - pnpm exec eslint . --ext .ts,.tsx,.vue
  - Auto-fix: pnpm exec eslint . --ext .ts,.tsx,.vue --fix
- Type-check
  - pnpm exec nuxi typecheck
- Run all unit tests (Vitest via @nuxt/test-utils)
  - Prefer: pnpm exec vitest
  - If Vitest isn’t installed locally: pnpm dlx vitest
- Run a single test file
  - pnpm exec vitest app/components/ui/Virtua/core/cache.spec.ts
- Run a single test by name
  - pnpm exec vitest app/components/ui/Virtua/core/cache.spec.ts -t "pattern"
- OpenAPI documentation (available while dev server is running)
  - JSON: http://localhost:3000/_hidden/openapi.json
  - Swagger UI: http://localhost:3000/_hidden/swagger
  - Scalar UI: http://localhost:3000/_hidden/scalar

High-level architecture
- Framework
  - Nuxt 4 project with full-stack capabilities. Frontend lives under app/, backend lives under server/ and runs on Nitro (h3). Build/dev/preview are handled by the Nuxt CLI.
- Server (Nitro)
  - File-based API routes: server/api/** using defineEventHandler and per-file method naming (e.g., index.get.ts, index.post.ts). Routes often include defineRouteMeta for OpenAPI.
  - Middleware
    - server/middleware/00.RequestLogger.ts: request/response logging with timing, headers, and query details. Logs both to console and files via the shared logger.
    - server/middleware/01.Auth.ts: session-based auth gate for specific API paths/methods. Reads user session, validates against MongoDB (UserAuth model), and sets event.context.user.
  - Database
    - server/plugins/mongodb.ts initializes a single Mongoose connection using runtimeConfig.mongodbUri (MONGODB_URI). Connection readiness is logged.
  - Logging
    - server/utils/logger/BakaLogger.ts wraps Winston with custom levels, colored console output, log file persistence (logs/ or logs/dev/), and Sentry transport (@sentry/nuxt). In development, logs directory is cleaned on startup.
  - OpenAPI generation
    - server/routes/docs/openapi.ts aggregates handler metadata (defineRouteMeta) and shared Zod schemas (shared/validators/**) via zod-openapi to produce a merged spec at /_hidden/openapi.json with optional UIs at /_hidden/swagger and /_hidden/scalar.
  - Scheduled tasks
    - nuxt.config.ts configures Nitro scheduledTasks (e.g., hourly cleanup:tokens). These run with the server runtime.
- Frontend (Nuxt app)
  - Source is organized under app/ with pages/, layouts/, components/, composables/, plugins/, providers/.
  - UI
    - Tailwind CSS v4 via @tailwindcss/postcss; global stylesheet at app/assets/css/tailwind.css.
    - A large component set under app/components/ui (Vue 3 components) and Virtua (TSX-based virtualization utilities with accompanying specs).
  - Runtime config and images
    - Custom image providers configured in nuxt.config.ts (proxy and netease). Aliyun base URL controlled by NUXT_IMAGE_ALIYUN_BASE_URL.
- Shared validation/types
  - Zod validators under shared/validators/** are used across the API and for OpenAPI schema generation.
  - Type definitions live under types/** and are aliased/imported where needed.

Environment configuration (set before running commands)
- MONGODB_URI
- NUXT_SESSION_PASSWORD (optional; see nuxt.config.ts session.password)
- OAuth (if using social login)
  - NUXT_OAUTH_GITHUB_CLIENT_ID
  - NUXT_OAUTH_GITHUB_CLIENT_SECRET
  - NUXT_OAUTH_GOOGLE_CLIENT_ID
  - NUXT_OAUTH_GOOGLE_CLIENT_SECRET
- Images
  - NUXT_IMAGE_ALIYUN_BASE_URL (optional)

Notes and conventions
- Package manager: pnpm is preferred (pnpm-lock.yaml present). npm/yarn/bun equivalents are shown in README.md but pnpm commands are canonical here.
- ESLint configuration: eslint.config.mjs extends .nuxt/eslint.config.mjs at runtime. Use pnpm exec eslint to ensure the correct Node/ESM context.
- Tests: Spec files exist (e.g., app/components/ui/Virtua/core/cache.spec.ts, VList.ssr.spec.ts). Use Vitest; if not installed locally, use pnpm dlx vitest.
