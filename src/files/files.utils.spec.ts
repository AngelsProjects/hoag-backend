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
