import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { ConfigService } from '@nestjs/config';
import { hashPassword, verifyPassword } from '../src/admin/password';
import {
  AuthService,
  csrfFor,
  digest,
  requirePermission,
} from '../src/admin/auth.service';
import { CmsService, validateFields } from '../src/admin/cms.service';
import { modules } from '../src/admin/modules';
import { fileType } from '../src/admin/media.controller';
const admin = {
  id: 'u',
  name: 'Editor',
  email: 'editor@example.invalid',
  permissions: ['*'],
  sessionId: 's',
};
function fixture() {
  const token = 'a'.repeat(64);
  const record = {
    id: 's',
    expiresAt: new Date(Date.now() + 60000),
    lastSeenAt: new Date(),
    user: {
      id: 'u',
      name: 'Editor',
      email: 'test@example.invalid',
      active: true,
      isDemo: false,
      roles: [{ role: { permissions: ['activities:read'] } }],
    },
  };
  const db = {
    adminSession: {
      findUnique: async () => record,
      update: async () => {},
      deleteMany: async () => {},
    },
    $queryRaw: async () => [{ count: 1 }],
    user: { findUnique: async () => null },
  };
  const auth = new AuthService(
    db as any,
    new ConfigService({
      NODE_ENV: 'production',
      CORS_ORIGINS: 'https://ufde.example',
    }),
  );
  const req = (method = 'GET', csrf?: string) =>
    ({
      method,
      headers: {
        cookie: '__Host-ufde_session=' + token,
        origin: 'https://ufde.example',
        ...(csrf ? { 'x-csrf-token': csrf } : {}),
      },
      socket: { remoteAddress: '127.0.0.1' },
    }) as any;
  return { auth, record, req, token, db };
}
test('password hashes use distinct salts and reject incorrect passwords', async () => {
  const a = await hashPassword('A sufficiently long test password');
  const b = await hashPassword('A sufficiently long test password');
  assert.notEqual(a, b);
  assert.equal(
    await verifyPassword('A sufficiently long test password', a),
    true,
  );
  assert.equal(await verifyPassword('Incorrect password', a), false);
  await assert.rejects(hashPassword('short'));
});
test('session requires cookie, rejects expiry, disabled accounts and demo accounts', async () => {
  const { auth, record, req } = fixture();
  assert.equal((await auth.authenticate(req())).id, 'u');
  await assert.rejects(
    auth.authenticate({
      method: 'GET',
      headers: { authorization: 'Bearer token' },
    } as any),
  );
  record.expiresAt = new Date(0);
  await assert.rejects(auth.authenticate(req()));
  record.expiresAt = new Date(Date.now() + 60000);
  record.user.active = false;
  await assert.rejects(auth.authenticate(req()));
  record.user.active = true;
  record.user.isDemo = true;
  await assert.rejects(auth.authenticate(req()));
});
test('mutations require trusted origin and session-bound CSRF token', async () => {
  const { auth, req, token } = fixture();
  await assert.rejects(auth.authenticate(req('PUT')));
  await assert.rejects(auth.authenticate(req('PUT', '0'.repeat(64))));
  assert.equal((await auth.authenticate(req('PUT', csrfFor(token)))).id, 'u');
  const evil = req('PUT', csrfFor(token));
  evil.headers.origin = 'https://attacker.invalid';
  await assert.rejects(auth.authenticate(evil));
});
test('idle timeout, cookie duplication and role checks fail closed', async () => {
  const { auth, req, record } = fixture();
  record.lastSeenAt = new Date(Date.now() - 31 * 60000);
  await assert.rejects(auth.authenticate(req()));
  const duplicate = req();
  duplicate.headers.cookie += '; ' + duplicate.headers.cookie;
  assert.equal(auth.token(duplicate), '');
  assert.throws(() =>
    requirePermission(
      { ...admin, permissions: ['activities:read'] },
      'contacts:read',
    ),
  );
});
test('login blocks unknown accounts and persistent rate limit excess', async () => {
  const { auth, req, db } = fixture();
  await assert.rejects(
    auth.login(
      req('POST'),
      {} as any,
      'unknown@example.invalid',
      'Not a real password',
    ),
  );
  db.$queryRaw = async () => [{ count: 101 }];
  await assert.rejects(
    auth.login(
      req('POST'),
      {} as any,
      'unknown@example.invalid',
      'Not a real password',
    ),
    (error: any) => error.getStatus() === 429,
  );
});
test('login rotates session token and uses secure HttpOnly cookie without returning token', async () => {
  const { auth, req, db } = fixture();
  const password = 'A secure test password only';
  const user = {
    id: 'u',
    email: 'editor@example.invalid',
    name: 'Editor',
    active: true,
    isDemo: false,
    passwordHash: await hashPassword(password),
    roles: [{ role: { permissions: ['*'] } }],
  };
  db.user.findUnique = async () => user as any;
  let session: any, cookie: any;
  Object.assign(db, {
    $transaction: async (fn: any) =>
      fn({
        adminSession: {
          deleteMany: async () => {},
          create: async ({ data }: any) => {
            session = data;
          },
        },
        adminAuditLog: { create: async () => {} },
      }),
  });
  const result = await auth.login(
    req('POST'),
    {
      cookie: (name: string, value: string, options: any) => {
        cookie = { name, value, options };
      },
      setHeader() {},
    } as any,
    user.email,
    password,
  );
  assert.equal(cookie.name, '__Host-ufde_session');
  assert.equal(cookie.options.httpOnly, true);
  assert.equal(cookie.options.secure, true);
  assert.equal(cookie.options.sameSite, 'lax');
  assert.equal(session.tokenHash, digest(cookie.value));
  assert.equal(result.csrf, csrfFor(cookie.value));
  assert.equal(JSON.stringify(result).includes(cookie.value), false);
});
test('CMS rejects mass assignment, invalid URLs and duplicate translations', async () => {
  assert.throws(() =>
    validateFields(modules.partners.fields, {
      slug: 'test',
      name: 'Name',
      passwordHash: 'oops',
    }),
  );
  assert.throws(() =>
    validateFields(modules.partners.fields, {
      slug: 'test',
      name: 'Name',
      website: 'javascript:alert(1)',
    }),
  );
  const cms = new CmsService({} as any);
  await assert.rejects(
    cms.save(admin, 'strategic-areas', undefined, {
      fields: { slug: 'test' },
      translations: [
        { locale: 'EN', title: 'T', summary: 'S' },
        { locale: 'EN', title: 'T', summary: 'S' },
      ],
    }),
  );
  await assert.rejects(
    cms.save(
      { ...admin, permissions: ['projects:read'] },
      'projects',
      undefined,
      {},
    ),
  );
});
test('draft/demo publication restrictions and optimistic conflicts are enforced', async () => {
  const cms = new CmsService({
    $transaction: async (fn: any) =>
      fn({
        strategicArea: {
          findUnique: async () => ({ id: 'x', updatedAt: new Date(0) }),
        },
      }),
  } as any);
  await assert.rejects(
    cms.save(admin, 'strategic-areas', undefined, {
      fields: { slug: 'test', published: true, isDemo: true },
      translations: [{ locale: 'EN', title: 'T', summary: 'S' }],
    }),
  );
  await assert.rejects(
    cms.save(admin, 'strategic-areas', 'x', {
      fields: { slug: 'test' },
      version: new Date().toISOString(),
      translations: [{ locale: 'EN', title: 'T', summary: 'S' }],
    }),
    (error: any) => error.getStatus() === 409,
  );
});
test('uploads reject scripts, malformed files and oversize PDFs', () => {
  assert.throws(() => fileType(Buffer.from('<svg onload="alert(1)"></svg>')));
  assert.throws(() => fileType(Buffer.from('<html>not an image</html>')));
  assert.throws(() => fileType(Buffer.alloc(4 * 1024 * 1024 + 1)));
  assert.equal(
    fileType(Buffer.from('%PDF-1.7\nDEMO testing bytes\n%%EOF')).mime,
    'application/pdf',
  );
});
