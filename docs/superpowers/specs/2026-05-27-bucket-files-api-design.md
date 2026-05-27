# Bucket Files API — Design Spec

**Date:** 2026-05-27  
**Stack:** NestJS (latest stable) · Node.js 24 · TypeScript · REST

---

## Goal

Read-only REST API that returns full directory tree of `/Users/arciniega/Documents/hoag/bucket` as a nested JSON structure. No write operations. No auth.

---

## Endpoint

Default port: `4000`

```
GET /files
```

**Response:** `200 OK`
```json
{
  "name": "bucket",
  "type": "dir",
  "path": "/",
  "children": [
    {
      "name": "arciniega.io",
      "type": "dir",
      "path": "/arciniega.io",
      "children": [...]
    },
    {
      "name": "507956127_...jpg",
      "type": "file",
      "path": "/507956127_...jpg"
    }
  ]
}
```

Paths are relative to bucket root — no absolute filesystem paths in response.

---

## Layer Structure

```
src/
  main.ts
  app.module.ts
  files/
    files.module.ts
    files.controller.ts   # HTTP layer only
    files.service.ts      # orchestration + response shaping
    files.utils.ts        # pure async FS tree builder
  config/
    bucket.config.ts      # BUCKET_ROOT constant
```

### Controller
HTTP-only. Receives `GET /files`, calls service, returns result. No FS logic, no business logic.

### Service
Calls `buildTree` util, receives raw `TreeNode`, returns it as response. Single responsibility: orchestrate and shape.

### Utils (`files.utils.ts`)
Pure function: `buildTree(dirPath: string): Promise<TreeNode>`. No NestJS imports. Uses `fs.promises.readdir` + `Promise.all` for non-blocking parallel reads. Filters dot-files before recursing.

### Config (`bucket.config.ts`)
Exports `BUCKET_ROOT = '/Users/arciniega/Documents/hoag/bucket'`. Single source of truth. No `ConfigModule` needed.

---

## TreeNode Type

```typescript
interface TreeNode {
  name: string;
  type: 'file' | 'dir';
  path: string;           // relative to BUCKET_ROOT, leading slash
  children?: TreeNode[];  // only present on type === 'dir'
}
```

---

## Filtering Rules

- Skip any entry where `name.startsWith('.')` — applied before recursing into subdirectories
- Covers: `.DS_Store`, `.git`, `.env*`, `.next`, `.husky`, etc.

---

## Data Flow

```
GET /files
  → FilesController.getFiles()
  → FilesService.getFileTree()
  → buildTree(BUCKET_ROOT)        # async, parallel dir reads
  → TreeNode (with relative paths)
  → 200 response
```

---

## Error Handling

| Scenario | Behavior |
|---|---|
| `BUCKET_ROOT` dir not found | `500` — config error, not client error |
| Permission denied on subdir | Skip node, log warning — partial tree returned |

---

## Testing

| Layer | Type | What |
|---|---|---|
| `files.utils.ts` | Unit (real FS, temp dir) | Dot-file exclusion, nested dirs, empty dirs |
| `files.service.ts` | Unit (mock util) | Correct TreeNode shape in response |
| `files.controller.ts` | E2E (`@nestjs/testing` + supertest) | `GET /files` → 200 + valid tree |

---

## Out of Scope

- Authentication / authorization
- File content serving
- Path query params / subtree browsing
- File metadata (size, mtime, mimeType)
- Write operations of any kind
