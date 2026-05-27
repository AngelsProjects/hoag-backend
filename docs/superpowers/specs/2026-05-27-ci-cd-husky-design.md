# CI/CD + Husky Design

**Date:** 2026-05-27  
**Project:** hoag/backend (NestJS)  
**Status:** Approved

---

## Overview

Add local commit gates via Husky + lint-staged and a GitHub Actions CI workflow that validates lint, format, typecheck, unit tests, e2e tests, and build on every push and pull request.

---

## Local Gates (Husky)

### Dependencies

- `husky` — git hooks manager
- `lint-staged` — run checks only on staged files (faster pre-commit)

### `pre-commit`

Scoped to staged files via lint-staged:

1. **Lint** — `eslint --fix` on staged `.ts` files
2. **Format** — `prettier --check` on staged `.ts` files
3. **Typecheck** — `tsc --noEmit` (full project, not stageable)

### `pre-push`

Full validation before code reaches remote:

1. All pre-commit checks (re-run on full codebase)
2. **Unit tests** — `pnpm test:cov`
3. **Build** — `pnpm build`

E2e tests are excluded from pre-push to keep push time reasonable; they run in CI.

---

## GitHub Actions

### File

`.github/workflows/ci.yml`

### Triggers

```yaml
on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]
```

### Jobs

| Job | Depends On | Steps |
|-----|-----------|-------|
| `lint` | — | checkout, setup Node 20, pnpm install, eslint, prettier check, tsc --noEmit |
| `test` | — | checkout, setup Node 20, pnpm install, jest --coverage |
| `test-e2e` | — | checkout, setup Node 20, pnpm install, jest --config test/jest-e2e.json (continue-on-error: false, runs independently) |
| `build` | `lint` | checkout, setup Node 20, pnpm install, nest build |

Jobs run in parallel except `build` which waits on `lint`.

### Node / Package Manager

- Node: `20.x` (LTS)
- Package manager: `pnpm` (matches existing `pnpm-lock.yaml`)
- Cache: pnpm store via `actions/setup-node` cache or `actions/cache`

---

## Scripts Added to package.json

| Script | Command |
|--------|---------|
| `format:check` | `prettier --check "src/**/*.ts" "test/**/*.ts"` |
| `typecheck` | `tsc --noEmit` |
| `prepare` | `husky` |

---

## File Structure After Implementation

```
.github/
  workflows/
    ci.yml
.husky/
  pre-commit
  pre-push
src/         (unchanged)
package.json (scripts + devDeps updated)
```

---

## Out of Scope

- Deployment workflows (no CD, CI only)
- Conventional commit enforcement (not requested)
- Coverage thresholds (not requested)
- Branch protection rules (configured in GitHub UI, not here)
