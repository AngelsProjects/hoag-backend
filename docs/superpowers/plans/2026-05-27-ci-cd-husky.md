# CI/CD + Husky Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Husky git hooks for local commit/push gates and a GitHub Actions CI workflow that runs lint, format check, typecheck, unit tests, e2e tests, and build on every push and PR.

**Architecture:** Husky manages two hooks — `pre-commit` (fast staged-file checks via lint-staged) and `pre-push` (full unit tests + build). GitHub Actions runs four parallel jobs (lint, test, test-e2e, build) triggered on push to any branch and PRs to main.

**Tech Stack:** NestJS, TypeScript, ESLint, Prettier, Jest, pnpm, Husky, lint-staged, GitHub Actions

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `package.json` | Add `prepare`, `format:check`, `typecheck` scripts; add `lint-staged` config; add husky + lint-staged devDeps |
| Create | `.husky/pre-commit` | Run lint-staged on staged files |
| Create | `.husky/pre-push` | Run full unit tests + build |
| Create | `.github/workflows/ci.yml` | Four-job CI workflow |

---

## Task 1: Install Husky and lint-staged

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install dependencies**

```bash
cd /Users/arciniega/Documents/hoag/backend
pnpm add -D husky lint-staged
```

Expected: husky and lint-staged appear in `devDependencies` in `package.json`.

- [ ] **Step 2: Initialize husky**

```bash
pnpm exec husky init
```

Expected: `.husky/` directory created with a default `pre-commit` file.

- [ ] **Step 3: Verify husky installed correctly**

```bash
ls .husky/
```

Expected output includes `pre-commit`.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml .husky/
git commit -m "chore: install husky and lint-staged"
```

---

## Task 2: Add missing npm scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add `format:check`, `typecheck`, and `prepare` scripts**

Open `package.json` and add to the `"scripts"` block:

```json
"format:check": "prettier --check \"src/**/*.ts\" \"test/**/*.ts\"",
"typecheck": "tsc --noEmit",
"prepare": "husky"
```

Final relevant portion of `package.json` scripts:

```json
"scripts": {
  "build": "nest build",
  "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
  "format:check": "prettier --check \"src/**/*.ts\" \"test/**/*.ts\"",
  "typecheck": "tsc --noEmit",
  "start": "nest start",
  "start:dev": "nest start --watch",
  "start:debug": "nest start --debug --watch",
  "start:prod": "node dist/main",
  "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
  "test:e2e": "jest --config ./test/jest-e2e.json",
  "prepare": "husky"
}
```

- [ ] **Step 2: Add lint-staged config** (add as top-level key in `package.json`)

```json
"lint-staged": {
  "*.ts": [
    "eslint --fix",
    "prettier --check"
  ]
}
```

- [ ] **Step 3: Verify scripts work**

```bash
pnpm run format:check
```

Expected: exits 0 if all files formatted, or lists unformatted files.

```bash
pnpm run typecheck
```

Expected: exits 0 with no type errors.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: add format:check, typecheck, prepare scripts and lint-staged config"
```

---

## Task 3: Configure pre-commit hook

**Files:**
- Modify: `.husky/pre-commit`

- [ ] **Step 1: Write pre-commit hook**

Replace contents of `.husky/pre-commit` with:

```sh
pnpm exec lint-staged
pnpm run typecheck
```

- [ ] **Step 2: Ensure the file is executable**

```bash
chmod +x .husky/pre-commit
```

- [ ] **Step 3: Test the hook manually**

```bash
git add src/
git stash  # stash any unstaged changes if needed
pnpm exec lint-staged
```

Expected: ESLint and Prettier run only on staged `.ts` files, exit 0.

```bash
pnpm run typecheck
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add .husky/pre-commit
git commit -m "chore: configure pre-commit hook with lint-staged and typecheck"
```

---

## Task 4: Configure pre-push hook

**Files:**
- Create: `.husky/pre-push`

- [ ] **Step 1: Write pre-push hook**

Create `.husky/pre-push` with contents:

```sh
pnpm run test:cov
pnpm run build
```

- [ ] **Step 2: Make the file executable**

```bash
chmod +x .husky/pre-push
```

- [ ] **Step 3: Verify tests pass**

```bash
pnpm run test:cov
```

Expected: all unit tests pass, coverage report printed, exits 0.

- [ ] **Step 4: Verify build passes**

```bash
pnpm run build
```

Expected: `dist/` directory populated, exits 0 with no errors.

- [ ] **Step 5: Commit**

```bash
git add .husky/pre-push
git commit -m "chore: configure pre-push hook with unit tests and build"
```

---

## Task 5: Create GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflows directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Write CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Lint, Format & Typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: latest

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm run lint

      - name: Format check
        run: pnpm run format:check

      - name: Typecheck
        run: pnpm run typecheck

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: latest

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run unit tests with coverage
        run: pnpm run test:cov

  test-e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: latest

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run e2e tests
        run: pnpm run test:e2e

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: latest

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm run build
```

- [ ] **Step 3: Verify YAML is valid**

```bash
cat .github/workflows/ci.yml
```

Expected: file prints without error. If you have `yq` or `python3` available:

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "valid"
```

Expected: `valid`

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for lint, test, e2e, and build"
```

---

## Task 6: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Verify all scripts defined in package.json run cleanly**

```bash
pnpm run lint
pnpm run format:check
pnpm run typecheck
pnpm run test:cov
pnpm run test:e2e
pnpm run build
```

Each should exit 0. Fix any failures before continuing.

- [ ] **Step 2: Test pre-commit hook fires on a dummy commit**

```bash
# Make a trivial staged change
echo "// test" >> src/main.ts
git add src/main.ts
git commit -m "test: verify pre-commit hook"
```

Expected: lint-staged runs ESLint + Prettier on `src/main.ts`, then typecheck runs. Commit succeeds.

Revert if needed:

```bash
git revert HEAD --no-edit
```

- [ ] **Step 3: Push branch to GitHub and verify CI runs**

```bash
git push origin main
```

Expected: GitHub Actions workflow triggers. Open the repository's Actions tab and confirm all four jobs (`lint`, `test`, `test-e2e`, `build`) appear and pass.

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -p
git commit -m "chore: fix issues found during e2e verification"
```
