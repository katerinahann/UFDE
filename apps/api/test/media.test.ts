import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { ConfigService } from '@nestjs/config';
import { prepareImages, safeSvg } from '../src/media/images';
import { MediaStorage } from '../src/media/storage.service';
import { AdminMediaService } from '../src/admin/media.controller';

test('photos retain exact originals and produce bounded WebP/AVIF sizes without upscaling', async () => {
  const original = await sharp({
    create: { width: 2000, height: 1200, channels: 3, background: '#18426b' },
  })
    .jpeg()
    .toBuffer();
  const result = await prepareImages(original, 'HERO');
  assert.equal(result.renditions.length, 7);
  assert.deepEqual(result.renditions[0].bytes, original);
  assert.equal(result.warnings.length, 0);
  for (const v of result.renditions.slice(1)) {
    const metadata = await sharp(v.bytes).metadata();
    assert.equal(metadata.format, v.format === 'avif' ? 'heif' : v.format);
    if (v.format === 'avif') assert.equal(metadata.compression, 'av1');
    assert.ok(metadata.width! <= 2000);
    assert.ok(
      Math.abs(metadata.width! / metadata.height! - 2000 / 1200) < 0.01,
    );
    assert.equal(metadata.exif, undefined);
  }
  assert.equal(
    result.renditions.find((v) => v.name === 'thumbnail')?.width,
    320,
  );
  assert.equal(result.renditions.find((v) => v.name === 'medium')?.width, 960);
});
test('official SVG logos preserve full proportions and transparent PNG fallback', async () => {
  const svg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200" viewBox="0 0 600 200"><title>DEMO test artwork</title><rect x="100" y="50" width="400" height="100" fill="#123456"/></svg>',
  );
  const result = await prepareImages(svg, 'LOGO');
  assert.equal(result.renditions[0].format, 'svg');
  assert.equal(result.renditions.filter((v) => v.format === 'avif').length, 0);
  for (const variant of result.renditions.filter((v) => v.format === 'png')) {
    const metadata = await sharp(variant.bytes).metadata();
    assert.equal(metadata.hasAlpha, true);
    assert.ok(Math.abs(metadata.width! / metadata.height! - 3) < 0.01);
  }
  assert.equal(result.renditions.find((v) => v.name === 'large')?.width, 600);
  await assert.rejects(prepareImages(svg, 'HERO'));
});
test('SVG rejects scripts, external URLs, entities, CSS and embedded HTML', () => {
  for (const body of [
    '<script>alert(1)</script>',
    '<foreignObject><div>HTML</div></foreignObject>',
    '<image href="https://evil.invalid/a.png"/>',
    '<path onload="alert(1)"/>',
    '<style>svg{fill:red}</style>',
    '<use href="data:text/html,evil"/>',
  ])
    assert.throws(() =>
      safeSvg(
        Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg">' + body + '</svg>',
        ),
      ),
    );
  assert.throws(() =>
    safeSvg(
      Buffer.from(
        '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg>&x;</svg>',
      ),
    ),
  );
});
test('undersized images warn, malformed images fail, and PDFs have only an original', async () => {
  const png = await sharp({
    create: { width: 300, height: 200, channels: 4, background: '#fff' },
  })
    .png()
    .toBuffer();
  assert.equal((await prepareImages(png, 'PORTRAIT')).warnings.length, 1);
  await assert.rejects(prepareImages(png,'HERO'));
  await assert.rejects(
    prepareImages(
      Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        Buffer.alloc(20),
      ]),
      'GENERAL',
    ),
  );
  const pdf = await prepareImages(
    Buffer.from('%PDF-1.7\nDEMO test bytes\n%%EOF'),
    'DOCUMENT',
  );
  assert.equal(pdf.renditions.length, 1);
});
test('local storage uses files and rejects path traversal', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ufde-media-'));
  try {
    const storage = new MediaStorage(
      new ConfigService({ MEDIA_DIRECTORY: directory, MEDIA_STORAGE: 'local' }),
    );
    const location = storage.location();
    await storage.put(
      location,
      'record/original.png',
      Buffer.from('test'),
      'image/png',
    );
    assert.equal(
      (await storage.get(location, 'record/original.png')).toString(),
      'test',
    );
    await assert.rejects(storage.get(location, '../secret'));
    await storage.remove(location, 'record/original.png');
    await assert.rejects(storage.get(location, 'record/original.png'));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
test('S3-compatible adapter signs requests and round-trips private objects', async () => {
  const objects = new Map<string, Buffer>();
  let signed = false;
  const server = createServer(async (req, res) => {
    const key = new URL(req.url!, 'http://localhost').pathname;
    signed ||= !!req.headers.authorization?.startsWith('AWS4-HMAC-SHA256');
    if (req.method === 'PUT') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      objects.set(key, Buffer.concat(chunks));
      res.setHeader('ETag', '"test"');
      res.end();
    } else if (req.method === 'GET') {
      res.end(objects.get(key));
    } else {
      objects.delete(key);
      res.statusCode = 204;
      res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as { port: number }).port;
  try {
    const storage = new MediaStorage(
      new ConfigService({
        MEDIA_STORAGE: 's3',
        S3_ENDPOINT: `http://127.0.0.1:${port}`,
        S3_REGION: 'us-east-1',
        S3_BUCKET: 'test-bucket',
        S3_FORCE_PATH_STYLE: 'true',
        S3_ACCESS_KEY_ID: 'test-key',
        S3_SECRET_ACCESS_KEY: 'test-secret',
      }),
    );
    const location = storage.location();
    await storage.put(
      location,
      'record/source.webp',
      Buffer.from('test bytes'),
      'image/webp',
    );
    assert.equal(
      (await storage.get(location, 'record/source.webp')).toString(),
      'test bytes',
    );
    assert.ok(objects.has('/test-bucket/record/source.webp'));
    await storage.remove(location, 'record/source.webp');
    assert.equal(objects.size, 0);
    assert.equal(signed, true);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
test('failed database writes roll back stored variants; private variants remain private', async () => {
  const keys: string[] = [];
  const removed: string[] = [];
  const storage = {
    location: () => ({ storageProvider: 'LOCAL' }),
    put: async (_l: any, key: string) => {
      keys.push(key);
    },
    remove: async (_l: any, key: string) => {
      removed.push(key);
    },
  };
  const media = new AdminMediaService(
    {
      $transaction: async () => {
        throw new Error('Database unavailable');
      },
    } as any,
    storage as any,
  );
  const req = { admin: { id: 'test', permissions: ['media:write'] } } as any;
  await assert.rejects(
    media.upload(
      req,
      {
        buffer: Buffer.from('%PDF-1.7\nDEMO test bytes\n%%EOF'),
        originalname: 'test.pdf',
      },
      'DOCUMENT',
    ),
  );
  assert.deepEqual(removed, keys);
  const privateService = new AdminMediaService(
    {
      media: {
        findUnique: async () => ({
          storageKey: 'x.pdf',
          visibility: 'PRIVATE',
          variants: [],
        }),
      },
    } as any,
    storage as any,
  );
  await assert.rejects(privateService.file('id', {} as any, true));
});
