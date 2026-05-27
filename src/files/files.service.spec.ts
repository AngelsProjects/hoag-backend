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
