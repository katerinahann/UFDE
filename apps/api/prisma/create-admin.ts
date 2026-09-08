import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from '../src/admin/password';
import { modules } from '../src/admin/modules';
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase(),
    name = process.env.ADMIN_NAME?.trim(),
    password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (
    !process.env.DATABASE_URL ||
    !email ||
    !name ||
    !password ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.endsWith('.invalid')
  )
    throw new Error(
      'Set DATABASE_URL, ADMIN_EMAIL, ADMIN_NAME and ADMIN_BOOTSTRAP_PASSWORD (14–256 characters)',
    );
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    const hash = await hashPassword(password);
    await db.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing && process.env.RESET_ADMIN_PASSWORD !== 'true')
        throw new Error(
          'Account exists. Explicit RESET_ADMIN_PASSWORD=true is required to reset it',
        );
      const role = await tx.role.upsert({
        where: { slug: 'administrator' },
        create: {
          slug: 'administrator',
          name: 'Administrator',
          permissions: ['*'],
        },
        update: { permissions: ['*'] },
      });
      for (const [slug, actions] of [
        ['editor', ['read', 'write']],
        ['publisher', ['read', 'write', 'publish']],
        ['reviewer', ['read']],
      ] as const) {
        const permissions = Object.keys(modules)
          .filter(
            (k) => !modules[k].private && !['settings', 'seo'].includes(k),
          )
          .flatMap((k) => actions.map((action) => k + ':' + action));
        await tx.role.upsert({
          where: { slug },
          create: { slug, name: slug, permissions },
          update: {},
        });
      }
      const user = await tx.user.upsert({
        where: { email },
        create: {
          email,
          name,
          passwordHash: hash,
          active: true,
          isDemo: false,
        },
        update: { name, passwordHash: hash, active: true, isDemo: false },
      });
      await tx.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        create: { userId: user.id, roleId: role.id },
        update: {},
      });
      await tx.adminSession.deleteMany({ where: { userId: user.id } });
      await tx.adminAuditLog.create({
        data: {
          userId: user.id,
          module: 'auth',
          action: existing ? 'password-reset' : 'account-created',
        },
      });
    });
    console.info(
      'Administrator account configured. No credentials were printed.',
    );
  } finally {
    await db.$disconnect();
  }
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Admin setup failed');
  process.exitCode = 1;
});
