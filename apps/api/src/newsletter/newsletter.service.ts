import {
  Injectable,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma.service';
import { NewsletterSubscribeDto } from './newsletter.dto';

export const tokenHash = (token: string) =>
  createHash('sha256').update(token).digest('hex');
const token = () => randomBytes(32).toString('hex');

/** Replace this DI provider with a Brevo, Mailchimp or SendGrid adapter.
 * This contract sends transactional confirmation only, never campaigns.
 * Implementations must not log tokens and should use the idempotency key. */
@Injectable()
export class NewsletterDelivery {
  isConfigured(): boolean {
    return false;
  }
  async sendConfirmation(_message: {
    email: string;
    language: string;
    confirmationToken: string;
    unsubscribeToken: string;
    idempotencyKey: string;
  }): Promise<void> {
    throw new ServiceUnavailableException(
      'Newsletter confirmation delivery is not configured',
    );
  }
}

@Injectable()
export class NewsletterService {
  constructor(
    private readonly db: PrismaService,
    private readonly config: ConfigService,
    private readonly delivery: NewsletterDelivery,
  ) {}

  async subscribe(dto: NewsletterSubscribeDto) {
    const email = dto.email.trim().toLowerCase();
    const doubleOptIn = this.config.get('NEWSLETTER_DOUBLE_OPT_IN') === 'true';
    if (doubleOptIn && !this.delivery.isConfigured())
      throw new ServiceUnavailableException(
        'Newsletter confirmation delivery is not configured',
      );
    const confirmationToken = token(),
      unsubscribeToken = token();
    const now = new Date();
    const row = await this.db.$transaction(async (tx) => {
      // Serialize requests for the same normalized address, including first inserts.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${'newsletter:' + email}))::text`;
      const existing = await tx.newsletterSubscriber.findUnique({
        where: { email },
      });
      // Never undo an unsubscribe through an unauthenticated email-only request.
      if (
        existing?.status === 'SUBSCRIBED' ||
        existing?.status === 'UNSUBSCRIBED'
      )
        return null;
      if (
        existing?.confirmationExpiresAt &&
        existing.confirmationExpiresAt > now
      )
        return null;
      const data = {
        language: dto.language.toUpperCase() as 'EN' | 'FR' | 'UK',
        source: dto.source,
        status: doubleOptIn ? ('PENDING' as const) : ('SUBSCRIBED' as const),
        consentVersion: 'newsletter-2026-09-v1',
        consentedAt: now,
        confirmationTokenHash: doubleOptIn
          ? tokenHash(confirmationToken)
          : null,
        confirmationExpiresAt: doubleOptIn
          ? new Date(now.getTime() + 24 * 60 * 60 * 1000)
          : null,
        unsubscribeTokenHash: tokenHash(unsubscribeToken),
      };
      if (existing) {
        // A concurrent unsubscribe/confirmation must win over a stale signup read.
        const changed = await tx.newsletterSubscriber.updateMany({
          where: { id: existing.id, status: 'PENDING' },
          data,
        });
        return changed.count
          ? tx.newsletterSubscriber.findUnique({ where: { id: existing.id } })
          : null;
      }
      return tx.newsletterSubscriber.create({ data: { email, ...data } });
    });
    if (row && doubleOptIn) {
      try {
        await this.delivery.sendConfirmation({
          email,
          language: dto.language,
          confirmationToken,
          unsubscribeToken,
          idempotencyKey:
            'newsletter-confirm:' + row.id + ':' + tokenHash(confirmationToken),
        });
      } catch {
        // A retry can issue a fresh token; never activate a subscriber after mail failure.
        await this.db.newsletterSubscriber.updateMany({
          where: {
            id: row.id,
            status: 'PENDING',
            confirmationTokenHash: tokenHash(confirmationToken),
          },
          data: { confirmationTokenHash: null, confirmationExpiresAt: null },
        });
        throw new ServiceUnavailableException(
          'Confirmation delivery temporarily unavailable',
        );
      }
    }
    // Identical responses for new, duplicate and suppressed addresses; no tokens leak.
    return { status: 'received', doubleOptIn };
  }

  async confirm(value: string) {
    const result = await this.db.newsletterSubscriber.updateMany({
      where: {
        confirmationTokenHash: tokenHash(value),
        status: 'PENDING',
        confirmationExpiresAt: { gt: new Date() },
      },
      data: {
        status: 'SUBSCRIBED',
        confirmedAt: new Date(),
        confirmationTokenHash: null,
        confirmationExpiresAt: null,
      },
    });
    if (!result.count)
      throw new BadRequestException('Invalid or expired confirmation token');
    return { status: 'confirmed' };
  }

  async unsubscribe(value: string) {
    await this.db.newsletterSubscriber.updateMany({
      where: {
        unsubscribeTokenHash: tokenHash(value),
        status: { not: 'UNSUBSCRIBED' },
      },
      data: {
        status: 'UNSUBSCRIBED',
        unsubscribedAt: new Date(),
        confirmationTokenHash: null,
        confirmationExpiresAt: null,
      },
    });
    return { status: 'unsubscribed' };
  }

  /** Internal use by a future authorized mail adapter, never a public email lookup. */
  async issueUnsubscribeToken(subscriberId: string) {
    const value = token();
    await this.db.newsletterSubscriber.update({
      where: { id: subscriberId },
      data: { unsubscribeTokenHash: tokenHash(value) },
    });
    return value;
  }
}
