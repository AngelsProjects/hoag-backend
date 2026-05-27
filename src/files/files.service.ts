import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
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
      this.logger.error(
        `Failed to read bucket root: ${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      throw new InternalServerErrorException('Could not read file tree');
    }
  }
}
