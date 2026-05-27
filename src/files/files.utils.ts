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
