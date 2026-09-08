ALTER TABLE "NewsletterSubscriber" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'website',
ADD COLUMN "confirmationExpiresAt" TIMESTAMP(3);
