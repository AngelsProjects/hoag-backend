# Bucket Files API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a NestJS REST API with a single `GET /files` endpoint that returns the full nested directory tree of `/Users/arciniega/Documents/hoag/bucket`, excluding all dot-files and dot-directories.

**Architecture:** Layered NestJS module with controller (HTTP only), service (orchestration), and a pure async utility function for recursive FS traversal. Config holds the hard-coded bucket root path. Dot-file filtering happens in the util before recursing.

**Tech Stack:** NestJS latest stable, Node.js 24, TypeScript, `fs.promises`, Jest (included with NestJS), supertest

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/main.ts` | Create | Bootstrap app on port 4000 |
| `src/app.module.ts` | Create | Root module, imports FilesModule |
| `src/config/bucket.config.ts` | Create | Exports `BUCKET_ROOT` constant |
| `src/files/files.module.ts` | Create | NestJS module wiring |
| `src/files/files.controller.ts` | Create | `GET /files` handler |
| `src/files/files.service.ts` | Create | Calls util, returns TreeNode |
| `src/files/files.utils.ts` | Create | Pure async recursive tree builder |
| `src/files/tree-node.interface.ts` | Create | `TreeNode` interface |
| `test/files.e2e-spec.ts` | Create | E2E test for `GET /files` |
| `src/files/files.utils.spec.ts` | Create | Unit tests for util |
| `src/files/files.service.spec.ts` | Create | Unit tests for service |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `nest-cli.json`
- Create: `src/main.ts`
- Create: `src/app.module.ts`

- [ ] **Step 1: Install NestJS CLI globally**

```bash
npm install -g @nestjs/cli
```

Expected: CLI available as `nest`

- [ ] **Step 2: Scaffold new project**

```bash
cd /Users/arciniega/Documents/hoag/backend
nest new . --package-manager npm --skip-git --language typescript
```

When prompted for package manager, select `npm`. This overwrites the empty dir with a full NestJS scaffold.

Expected: `src/main.ts`, `src/app.module.ts`, `src/app.controller.ts`, `src/app.service.ts`, `package.json`, `tsconfig.json`, `nest-cli.json` created.

- [ ] **Step 3: Remove default app controller and service (not needed)**

```bash
rm src/app.controller.ts src/app.controller.spec.ts src/app.service.ts
```

- [ ] **Step 4: Update `src/app.module.ts` — remove default controller/service refs**

```typescript
import { Module } from '@nestjs/common';

@Module({
  imports: [],
})
export class AppModule {}
```

- [ ] **Step 5: Update `src/main.ts` — set port 4000**

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(4000);
}
bootstrap();
```

- [ ] **Step 6: Verify app starts**

```bash
npm run start
```

Expected: `Application is running on: http://[::1]:4000` (no errors)

Stop server with `Ctrl+C`.

- [ ] **Step 7: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold NestJS project on port 4000"
```

---

## Task 2: Config — Bucket Root

**Files:**
- Create: `src/config/bucket.config.ts`

- [ ] **Step 1: Create config file**

```bash
mkdir -p src/config
```

- [ ] **Step 2: Write `src/config/bucket.config.ts`**

```typescript
export const BUCKET_ROOT = '/Users/arciniega/Documents/hoag/bucket';
```

- [ ] **Step 3: Verify file exists**

```bash
cat src/config/bucket.config.ts
```

Expected: file prints constant.

- [ ] **Step 4: Commit**

```bash
git add src/config/bucket.config.ts
git commit -m "chore: add bucket root config"
```

---

## Task 3: TreeNode Interface

**Files:**
- Create: `src/files/tree-node.interface.ts`

- [ ] **Step 1: Create files directory**

```bash
mkdir -p src/files
```

- [ ] **Step 2: Write `src/files/tree-node.interface.ts`**

```typescript
export interface TreeNode {
  name: string;
  type: 'file' | 'dir';
  path: string;
  children?: TreeNode[];
}
```

- [ ] **Step 3: Commit**

```bash
git add src/files/tree-node.interface.ts
git commit -m "feat: add TreeNode interface"
```

---

## Task 4: Files Util — Recursive Tree Builder

**Files:**
- Create: `src/files/files.utils.ts`
- Create: `src/files/files.utils.spec.ts`

- [ ] **Step 1: Write failing tests in `src/files/files.utils.spec.ts`**

```typescript
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { buildTree } from './files.utils';

describe('buildTree', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bucket-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns root dir node with correct name and path', async () => {
    const result = await buildTree(tmpDir, tmpDir);
    expect(result.name).toBe(path.basename(tmpDir));
    expect(result.type).toBe('dir');
    expect(result.path).toBe('/');
    expect(result.children).toEqual([]);
  });

  it('includes files as leaf nodes', async () => {
    fs.writeFileSync(path.join(tmpDir, 'hello.txt'), '');
    const result = await buildTree(tmpDir, tmpDir);
    expect(result.children).toHaveLength(1);
    expect(result.children![0]).toEqual({
      name: 'hello.txt',
      type: 'file',
      path: '/hello.txt',
    });
  });

  it('recurses into subdirectories', async () => {
    fs.mkdirSync(path.join(tmpDir, 'subdir'));
    fs.writeFileSync(path.join(tmpDir, 'subdir', 'file.ts'), '');
    const result = await buildTree(tmpDir, tmpDir);
    const subdir = result.children!.find((n) => n.name === 'subdir');
    expect(subdir).toBeDefined();
    expect(subdir!.type).toBe('dir');
    expect(subdir!.children).toHaveLength(1);
    expect(subdir!.children![0].name).toBe('file.ts');
  });

  it('excludes dot-files', async () => {
    fs.writeFileSync(path.join(tmpDir, '.DS_Store'), '');
    fs.writeFileSync(path.join(tmpDir, '.env'), '');
    fs.writeFileSync(path.join(tmpDir, 'visible.txt'), '');
    const result = await buildTree(tmpDir, tmpDir);
    const names = result.children!.map((n) => n.name);
    expect(names).not.toContain('.DS_Store');
    expect(names).not.toContain('.env');
    expect(names).toContain('visible.txt');
  });

  it('excludes dot-directories and does not recurse into them', async () => {
    fs.mkdirSync(path.join(tmpDir, '.git'));
    fs.writeFileSync(path.join(tmpDir, '.git', 'HEAD'), '');
    const result = await buildTree(tmpDir, tmpDir);
    const names = result.children!.map((n) => n.name);
    expect(names).not.toContain('.git');
  });

  it('paths are relative to root with leading slash', async () => {
    fs.mkdirSync(path.join(tmpDir, 'a'));
    fs.writeFileSync(path.join(tmpDir, 'a', 'b.txt'), '');
    const result = await buildTree(tmpDir, tmpDir);
    const aDir = result.children![0];
    expect(aDir.path).toBe('/a');
    expect(aDir.children![0].path).toBe('/a/b.txt');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx jest src/files/files.utils.spec.ts --no-coverage
```

Expected: FAIL — `Cannot find module './files.utils'`

- [ ] **Step 3: Write `src/files/files.utils.ts`**

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { TreeNode } from './tree-node.interface';

export async function buildTree(
  dirPath: string,
  rootPath: string,
): Promise<TreeNode> {
  const name = path.basename(dirPath);
  const relativePath = '/' + path.relative(rootPath, dirPath).replace(/\\/g, '/');
  const normalizedPath = relativePath === '/.' ? '/' : relativePath;

  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  const visible = entries.filter((e) => !e.name.startsWith('.'));

  const children = await Promise.all(
    visible.map(async (entry): Promise<TreeNode> => {
      const fullPath = path.join(dirPath, entry.name);
      const entryRelPath = '/' + path.relative(rootPath, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        return buildTree(fullPath, rootPath);
      }

      return {
        name: entry.name,
        type: 'file',
        path: entryRelPath,
      };
    }),
  );

  return {
    name,
    type: 'dir',
    path: normalizedPath,
    children,
  };
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx jest src/files/files.utils.spec.ts --no-coverage
```

Expected: PASS — 6 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/files/files.utils.ts src/files/files.utils.spec.ts
git commit -m "feat: add buildTree util with dot-file filtering"
```

---

## Task 5: Files Service

**Files:**
- Create: `src/files/files.service.ts`
- Create: `src/files/files.service.spec.ts`

- [ ] **Step 1: Write failing tests in `src/files/files.service.spec.ts`**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import * as utils from './files.utils';
import { TreeNode } from './tree-node.interface';

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FilesService],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  it('returns result of buildTree called with BUCKET_ROOT', async () => {
    const mockTree: TreeNode = {
      name: 'bucket',
      type: 'dir',
      path: '/',
      children: [],
    };

    jest.spyOn(utils, 'buildTree').mockResolvedValueOnce(mockTree);

    const result = await service.getFileTree();
    expect(result).toEqual(mockTree);
    expect(utils.buildTree).toHaveBeenCalledWith(
      expect.stringContaining('bucket'),
      expect.stringContaining('bucket'),
    );
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx jest src/files/files.service.spec.ts --no-coverage
```

Expected: FAIL — `Cannot find module './files.service'`

- [ ] **Step 3: Write `src/files/files.service.ts`**

```typescript
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { BUCKET_ROOT } from '../config/bucket.config';
import { buildTree } from './files.utils';
import { TreeNode } from './tree-node.interface';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  async getFileTree(): Promise<TreeNode> {
    try {
      return await buildTree(BUCKET_ROOT, BUCKET_ROOT);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to read bucket root: ${message}`);
      throw new InternalServerErrorException('Could not read file tree');
    }
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx jest src/files/files.service.spec.ts --no-coverage
```

Expected: PASS — 1 test passing

- [ ] **Step 5: Commit**

```bash
git add src/files/files.service.ts src/files/files.service.spec.ts
git commit -m "feat: add FilesService"
```

---

## Task 6: Files Controller

**Files:**
- Create: `src/files/files.controller.ts`

- [ ] **Step 1: Write `src/files/files.controller.ts`**

```typescript
import { Controller, Get } from '@nestjs/common';
import { FilesService } from './files.service';
import { TreeNode } from './tree-node.interface';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  async getFiles(): Promise<TreeNode> {
    return this.filesService.getFileTree();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/files/files.controller.ts
git commit -m "feat: add FilesController GET /files"
```

---

## Task 7: Files Module + Wire into AppModule

**Files:**
- Create: `src/files/files.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Write `src/files/files.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
```

- [ ] **Step 2: Update `src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { FilesModule } from './files/files.module';

@Module({
  imports: [FilesModule],
})
export class AppModule {}
```

- [ ] **Step 3: Start server and smoke test**

```bash
npm run start
```

In another terminal:
```bash
curl http://localhost:4000/files
```

Expected: JSON with `{ "name": "bucket", "type": "dir", "path": "/", "children": [...] }`

Stop server with `Ctrl+C`.

- [ ] **Step 4: Commit**

```bash
git add src/files/files.module.ts src/app.module.ts
git commit -m "feat: wire FilesModule into AppModule"
```

---

## Task 8: E2E Test

**Files:**
- Create: `test/files.e2e-spec.ts`
- Modify: `test/jest-e2e.json` (already exists from scaffold)

- [ ] **Step 1: Check existing e2e config**

```bash
cat test/jest-e2e.json
```

Expected: points to `test/**/*.e2e-spec.ts` pattern.

- [ ] **Step 2: Write `test/files.e2e-spec.ts`**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('FilesController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /files returns 200 with tree root', async () => {
    const res = await request(app.getHttpServer()).get('/files').expect(200);

    expect(res.body).toMatchObject({
      name: 'bucket',
      type: 'dir',
      path: '/',
    });
    expect(Array.isArray(res.body.children)).toBe(true);
  });

  it('GET /files tree contains no dot-file entries', async () => {
    const res = await request(app.getHttpServer()).get('/files').expect(200);

    const allNodes: { name: string }[] = [];
    const collect = (nodes: { name: string; children?: typeof nodes }[]) => {
      for (const n of nodes) {
        allNodes.push(n);
        if (n.children) collect(n.children);
      }
    };
    collect(res.body.children);

    const dotNames = allNodes.filter((n) => n.name.startsWith('.'));
    expect(dotNames).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run e2e tests**

```bash
npm run test:e2e
```

Expected: PASS — 2 tests passing

- [ ] **Step 4: Run all tests**

```bash
npm test
```

Expected: all unit + e2e tests pass

- [ ] **Step 5: Commit**

```bash
git add test/files.e2e-spec.ts
git commit -m "test: add e2e tests for GET /files"
```

---

## Task 9: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npm test && npm run test:e2e
```

Expected: all pass, no errors

- [ ] **Step 2: Start server, hit endpoint**

```bash
npm run start
curl -s http://localhost:4000/files | head -50
```

Expected: nested JSON tree, no dot-files, paths relative to bucket root.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: bucket files api complete"
```
