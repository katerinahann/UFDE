import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ContactDto, NewsletterDto } from '../src/dto';
import { validateEnvironment } from '../src/environment';
import { AdminGuard } from '../src/admin.guard';
import { ConfigService } from '@nestjs/config';
test('contact validates and normalizes email, does not require marketing consent and rejects oversize message', async () => {
  const valid = {
    name: 'Test Reviewer',
    email: ' TEST@example.org ',
    subject: 'Website enquiry',
    message: 'A sufficiently detailed test enquiry.',
    locale: 'en',
  };
  const dto = plainToInstance(ContactDto, valid);
  assert.equal((await validate(dto)).length, 0);
  assert.equal(dto.email, 'test@example.org');
  assert.ok(
    (await validate(plainToInstance(ContactDto, { ...valid, website: 'spam' })))
      .length,
  );
  assert.ok(
    (
      await validate(
        plainToInstance(ContactDto, { ...valid, message: 'x'.repeat(5001) }),
      )
    ).length,
  );
});
test('newsletter rejects honeypot and invalid locale', async () => {
  assert.ok(
    (
      await validate(
        plainToInstance(NewsletterDto, {
          email: 'x@example.org',
          locale: 'xx',
          consent: true,
          website: 'spam',
        }),
      )
    ).length,
  );
});
test('production refuses unsafe configuration', () => {
  assert.throws(() =>
    validateEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://localhost/test',
    }),
  );
  assert.throws(() =>
    validateEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://localhost/test',
      ADMIN_API_TOKEN: 'x'.repeat(48),
      CORS_ORIGINS: 'http://example.org',
      LEGAL_APPROVED: 'true',
    }),
  );
  assert.doesNotThrow(() =>
    validateEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://localhost/test',
      ADMIN_API_TOKEN: 'x'.repeat(48),
      CORS_ORIGINS: 'https://example.org',
      LEGAL_APPROVED: 'true',
    }),
  );
});
test('legacy admin endpoints require administrator session permission', async () => {
  const request = { headers: { authorization: 'Bearer legacy-token' } };
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({ setHeader() {} }),
    }),
  } as any;
  const guard = new AdminGuard({
    authenticate: async () => ({ permissions: ['activities:read'] }),
  } as any);
  await assert.rejects(guard.canActivate(context));
  const admin = new AdminGuard({
    authenticate: async () => ({ permissions: ['*'] }),
  } as any);
  assert.equal(await admin.canActivate(context), true);
});

import {
  NewsletterSubscribeDto,
  NewsletterTokenDto,
} from '../src/newsletter/newsletter.dto';
test('newsletter validates language, source, explicit consent, email and tokens', async () => {
  const valid = {
    email: ' NEWS@example.org ',
    language: 'fr',
    source: 'footer',
    consent: true,
  };
  const dto = plainToInstance(NewsletterSubscribeDto, valid);
  assert.equal(dto.email, 'news@example.org');
  assert.equal((await validate(dto)).length, 0);
  for (const change of [
    { email: 'invalid' },
    { language: 'de' },
    { source: 'x'.repeat(65) },
    { consent: false },
    { website: 'spam' },
  ])
    assert.ok(
      (
        await validate(
          plainToInstance(NewsletterSubscribeDto, { ...valid, ...change }),
        )
      ).length,
    );
  assert.ok(
    (await validate(plainToInstance(NewsletterTokenDto, { token: 'invalid' })))
      .length,
  );
});
