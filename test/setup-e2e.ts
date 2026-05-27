import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'hoag-e2e-'));
const bucketRoot = path.join(parent, 'bucket');
fs.mkdirSync(bucketRoot);

fs.mkdirSync(path.join(bucketRoot, 'docs'));
fs.writeFileSync(path.join(bucketRoot, 'docs', 'readme.md'), '# test\n');
fs.writeFileSync(path.join(bucketRoot, 'top.txt'), 'hello\n');
fs.writeFileSync(path.join(bucketRoot, '.hidden'), 'nope\n');

process.env.BUCKET_ROOT = bucketRoot;
