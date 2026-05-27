# Hoag Bucket Files API

Read-only REST API that serves a nested directory tree of the local bucket filesystem. Returns the full file/directory hierarchy as JSON, excluding all dot-files and dot-directories.

## Stack

- **Framework:** NestJS 11 (TypeScript)
- **Runtime:** Node.js 20+
- **Package Manager:** pnpm
- **Port:** 4000

## Architecture

Layered NestJS architecture with a single feature module:

```text
src/
├── main.ts                    # Bootstrap, port 4000
├── app.module.ts              # Root module
├── config/
│   └── bucket.config.ts       # BUCKET_ROOT constant
└── files/
    ├── files.module.ts
    ├── files.controller.ts    # HTTP layer — GET /files
    ├── files.service.ts       # Error handling + orchestration
    ├── files.utils.ts         # Pure async tree builder (fs.promises)
    └── tree-node.interface.ts # TreeNode type
```

**Data flow:** `Controller → Service → Utils (buildTree) → JSON response`

## API

### `GET /files`

Returns the full directory tree rooted at `BUCKET_ROOT`.

**Response:**

```json
{
  "name": "bucket",
  "type": "dir",
  "path": "/",
  "children": [
    {
      "name": "project-name",
      "type": "dir",
      "path": "/project-name",
      "children": []
    },
    {
      "name": "file.pdf",
      "type": "file",
      "path": "/file.pdf"
    }
  ]
}
```

**TreeNode schema:**

```typescript
interface TreeNode {
  name: string;
  type: 'file' | 'dir';
  path: string;          // Relative path from bucket root, leading slash
  children?: TreeNode[]; // Only for directories
}
```

**Filtering:** Dot-files and dot-directories (`.DS_Store`, `.git`, `.env`, etc.) are excluded at every level.

**Errors:**

- `500` — `BUCKET_ROOT` directory not found (config issue)
- Unreadable subdirectories are silently skipped (partial tree returned)

## Setup

```bash
pnpm install
```

Configure the bucket root in [src/config/bucket.config.ts](src/config/bucket.config.ts):

```typescript
export const BUCKET_ROOT = '/path/to/your/bucket';
```

## Running

```bash
# development (hot reload)
pnpm run start:dev

# production
pnpm run build
pnpm run start:prod

# debug
pnpm run start:debug
```

## Testing

```bash
# unit tests
pnpm run test

# unit tests with coverage
pnpm run test:cov

# e2e tests
pnpm run test:e2e

# watch mode
pnpm run test:watch
```

**Test structure:**

- `src/files/files.utils.spec.ts` — pure util tests using real temp filesystem
- `src/files/files.service.spec.ts` — service tests with mocked utils
- `test/files.e2e-spec.ts` — end-to-end via `@nestjs/testing` + supertest

## Code Quality

```bash
pnpm run lint          # ESLint with auto-fix
pnpm run format        # Prettier write
pnpm run format:check  # Prettier check only
pnpm run typecheck     # TypeScript check (no emit)
```

## Git Hooks (Husky)

**pre-commit:** lint-staged (ESLint + Prettier on staged `.ts` files) + full typecheck

**pre-push:** full unit test suite + build

## CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`) runs on push to any branch and on PRs to `main`:

| Job | Runs |
| --- | --- |
| `lint` | ESLint, Prettier check, typecheck |
| `test` | Unit tests with coverage |
| `test-e2e` | End-to-end tests |
| `build` | NestJS compile (depends on `lint`) |

All jobs use Node 20 LTS + pnpm with lockfile caching.
