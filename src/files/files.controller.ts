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
