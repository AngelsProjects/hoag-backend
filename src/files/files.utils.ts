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
  const visible = entries.filter(
    (e) => !e.name.startsWith('.') && (e.isFile() || e.isDirectory()),
  );

  const children = await Promise.all(
    visible.map(async (entry): Promise<TreeNode> => {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        return buildTree(fullPath, rootPath);
      }

      return {
        name: entry.name,
        type: 'file',
        path: '/' + path.relative(rootPath, fullPath).replace(/\\/g, '/'),
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
