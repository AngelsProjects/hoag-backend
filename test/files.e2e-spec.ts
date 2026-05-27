import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TreeNode } from '../src/files/tree-node.interface';

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
    const body = res.body as TreeNode;

    expect(body).toMatchObject({
      name: 'bucket',
      type: 'dir',
      path: '/',
    });
    expect(Array.isArray(body.children)).toBe(true);
  });

  it('GET /files tree contains no dot-file entries', async () => {
    const res = await request(app.getHttpServer()).get('/files').expect(200);
    const body = res.body as TreeNode;

    const allNodes: { name: string }[] = [];
    const collect = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        allNodes.push(n);
        if (n.children) collect(n.children);
      }
    };
    if (body.children) collect(body.children);

    const dotNames = allNodes.filter((n) => n.name.startsWith('.'));
    expect(dotNames).toHaveLength(0);
  });
});
