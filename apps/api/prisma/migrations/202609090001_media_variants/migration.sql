-- CreateEnum
CREATE TYPE "MediaStorageProvider" AS ENUM ('LOCAL', 'S3');

-- CreateEnum
CREATE TYPE "MediaPurpose" AS ENUM ('GENERAL', 'HERO', 'ACTIVITY_PROJECT', 'PORTRAIT', 'LOGO', 'DOCUMENT');

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "copyrightNotice" TEXT,
ADD COLUMN     "purpose" "MediaPurpose" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "storageBucket" TEXT,
ADD COLUMN     "storageProvider" "MediaStorageProvider" NOT NULL DEFAULT 'LOCAL';

-- CreateTable
CREATE TABLE "MediaVariant" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "sizeBytes" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaVariant_storageKey_key" ON "MediaVariant"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "MediaVariant_mediaId_name_format_key" ON "MediaVariant"("mediaId", "name", "format");

-- AddForeignKey
ALTER TABLE "MediaVariant" ADD CONSTRAINT "MediaVariant_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
