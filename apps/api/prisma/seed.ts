import { seedDevelopment } from './seed-data';
import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Explicit opt-in. Never seed public content, real people, legal records or partnerships.
if (
  process.env.NODE_ENV === 'production' ||
  process.env.ALLOW_DEMO_SEED !== 'true' ||
  !process.env.DATABASE_URL
) {
  throw new Error(
    'DEMO seed requires DATABASE_URL and ALLOW_DEMO_SEED=true outside production',
  );
}
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
seedDevelopment(db)
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
