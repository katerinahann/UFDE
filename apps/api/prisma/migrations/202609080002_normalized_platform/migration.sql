-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('EN', 'FR', 'UK');

-- CreateEnum
CREATE TYPE "PublicationType" AS ENUM ('SCIENTIFIC_JOURNAL', 'RESEARCH_REPORT', 'POLICY_BRIEF', 'WORKING_PAPER', 'ARTICLE_INSIGHT');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'FORTHCOMING', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNED', 'UPCOMING', 'ONGOING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TeamCategory" AS ENUM ('LEADERSHIP', 'ADVISORY');

-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('INSTITUTIONAL', 'ACADEMIC', 'RESEARCH', 'PUBLIC_AUTHORITY', 'INTERNATIONAL_ORGANISATION', 'LOCAL_AUTHORITY', 'STRATEGIC');

-- CreateEnum
CREATE TYPE "PartnerLabel" AS ENUM ('OUR_PARTNERS', 'INSTITUTIONAL_PARTNERS', 'SELECTED_PARTNERS', 'COLLABORATING_INSTITUTIONS');

-- CreateEnum
CREATE TYPE "MediaVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'COMING_SOON', 'AVAILABLE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'SUBSCRIBED', 'UNSUBSCRIBED');

-- AlterTable
ALTER TABLE "ContentTranslation" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "SiteSetting" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "category" "TeamCategory",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "googleScholar" TEXT,
ADD COLUMN     "institutionalProfile" TEXT,
ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "linkedin" TEXT,
ADD COLUMN     "orcid" TEXT,
ADD COLUMN     "portraitId" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "slug" TEXT,
ALTER COLUMN "role" SET DEFAULT '{}',
ALTER COLUMN "biography" SET DEFAULT '{}';

-- AlterTable
ALTER TABLE "ContactSubmission" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Subscriber" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT false,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "teamMemberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'site',
    "siteName" TEXT NOT NULL,
    "defaultLocale" "Locale" NOT NULL DEFAULT 'EN',
    "enabledLocales" "Locale"[] DEFAULT ARRAY['EN', 'FR', 'UK']::"Locale"[],
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "registeredOffice" TEXT,
    "foundedYear" INTEGER,
    "legalName" TEXT,
    "legalForm" TEXT,
    "registrationNumber" TEXT,
    "registrationDate" DATE,
    "officialPublicationUrl" TEXT,
    "siren" TEXT,
    "siret" TEXT,
    "socialLinks" JSONB NOT NULL DEFAULT '{}',
    "partnerLabel" "PartnerLabel" NOT NULL DEFAULT 'OUR_PARTNERS',
    "logoId" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageSEO" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "canonicalUrl" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT true,
    "openGraphImageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageSEO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "storageKey" TEXT,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT,
    "width" INTEGER,
    "height" INTEGER,
    "sha256" TEXT,
    "credit" TEXT,
    "licenseUrl" TEXT,
    "visibility" "MediaVisibility" NOT NULL DEFAULT 'PRIVATE',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaTranslation" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "altText" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityCategoryTranslation" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityCategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT,
    "strategicAreaId" TEXT,
    "coverId" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "countryCode" TEXT,
    "eventUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityTranslation" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "location" TEXT,
    "coverAlt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityImage" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectCategoryTranslation" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectCategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNED',
    "startDate" DATE,
    "endDate" DATE,
    "countries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contactEmail" TEXT,
    "categoryId" TEXT,
    "strategicAreaId" TEXT,
    "leadId" TEXT,
    "coverId" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTranslation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "background" TEXT,
    "objectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "activities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "outcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "institutionType" TEXT,
    "coverAlt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "countryCode" TEXT,
    "partnerType" "PartnerType" NOT NULL DEFAULT 'INSTITUTIONAL',
    "logoId" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerTranslation" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "displayName" TEXT,
    "description" TEXT,
    "logoAlt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectPartner" (
    "projectId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "role" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectPartner_pkey" PRIMARY KEY ("projectId","partnerId")
);

-- CreateTable
CREATE TABLE "ActivityPartner" (
    "activityId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityPartner_pkey" PRIMARY KEY ("activityId","partnerId")
);

-- CreateTable
CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "PublicationType" NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "language" "Locale" NOT NULL DEFAULT 'EN',
    "year" INTEGER,
    "doi" TEXT,
    "isbn" TEXT,
    "externalUrl" TEXT,
    "coverId" TEXT,
    "pdfId" TEXT,
    "strategicAreaId" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationTranslation" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "abstract" TEXT NOT NULL,
    "executiveSummary" TEXT,
    "citation" TEXT,
    "coverAlt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicationTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationAuthor" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orcid" TEXT,
    "institutionalProfile" TEXT,
    "affiliation" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicationAuthor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationAuthorship" (
    "publicationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "corresponding" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicationAuthorship_pkey" PRIMARY KEY ("publicationId","authorId")
);

-- CreateTable
CREATE TABLE "TeamMemberTranslation" (
    "id" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "displayName" TEXT,
    "role" TEXT NOT NULL,
    "biography" TEXT NOT NULL,
    "institutionRole" TEXT,
    "portraitAlt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMemberTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expertise" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expertise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertiseTranslation" (
    "id" TEXT NOT NULL,
    "expertiseId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpertiseTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMemberExpertise" (
    "teamMemberId" TEXT NOT NULL,
    "expertiseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMemberExpertise_pkey" PRIMARY KEY ("teamMemberId","expertiseId")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "language" "Locale" NOT NULL DEFAULT 'EN',
    "publicationDate" DATE,
    "fileId" TEXT,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTranslation" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategicArea" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "iconKey" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategicArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategicAreaTranslation" (
    "id" TEXT NOT NULL,
    "strategicAreaId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategicAreaTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "locale" "Locale" NOT NULL DEFAULT 'EN',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "consentVersion" TEXT NOT NULL,
    "consentedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "confirmationTokenHash" TEXT,
    "unsubscribeTokenHash" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectActivity" (
    "projectId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectActivity_pkey" PRIMARY KEY ("projectId","activityId")
);

-- CreateTable
CREATE TABLE "ProjectPublication" (
    "projectId" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectPublication_pkey" PRIMARY KEY ("projectId","publicationId")
);

-- CreateTable
CREATE TABLE "ProjectDocument" (
    "projectId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectDocument_pkey" PRIMARY KEY ("projectId","documentId")
);

-- CreateTable
CREATE TABLE "ActivityDocument" (
    "activityId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityDocument_pkey" PRIMARY KEY ("activityId","documentId")
);

-- CreateTable
CREATE TABLE "PublicationDocument" (
    "publicationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicationDocument_pkey" PRIMARY KEY ("publicationId","documentId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_slug_key" ON "User"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_teamMemberId_key" ON "User"("teamMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_slug_key" ON "Role"("slug");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "PageSEO_slug_locale_key" ON "PageSEO"("slug", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Media_slug_key" ON "Media"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Media_storageKey_key" ON "Media"("storageKey");

-- CreateIndex
CREATE INDEX "Media_uploadedById_idx" ON "Media"("uploadedById");

-- CreateIndex
CREATE INDEX "Media_visibility_isDemo_idx" ON "Media"("visibility", "isDemo");

-- CreateIndex
CREATE UNIQUE INDEX "MediaTranslation_mediaId_locale_key" ON "MediaTranslation"("mediaId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityCategory_slug_key" ON "ActivityCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityCategoryTranslation_categoryId_locale_key" ON "ActivityCategoryTranslation"("categoryId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_slug_key" ON "Activity"("slug");

-- CreateIndex
CREATE INDEX "Activity_published_isDemo_publishedAt_idx" ON "Activity"("published", "isDemo", "publishedAt");

-- CreateIndex
CREATE INDEX "Activity_categoryId_idx" ON "Activity"("categoryId");

-- CreateIndex
CREATE INDEX "Activity_strategicAreaId_idx" ON "Activity"("strategicAreaId");

-- CreateIndex
CREATE INDEX "Activity_coverId_idx" ON "Activity"("coverId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityTranslation_activityId_locale_key" ON "ActivityTranslation"("activityId", "locale");

-- CreateIndex
CREATE INDEX "ActivityImage_activityId_sortOrder_idx" ON "ActivityImage"("activityId", "sortOrder");

-- CreateIndex
CREATE INDEX "ActivityImage_mediaId_idx" ON "ActivityImage"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityImage_activityId_mediaId_key" ON "ActivityImage"("activityId", "mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCategory_slug_key" ON "ProjectCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCategoryTranslation_categoryId_locale_key" ON "ProjectCategoryTranslation"("categoryId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_published_isDemo_status_publishedAt_idx" ON "Project"("published", "isDemo", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "Project_categoryId_idx" ON "Project"("categoryId");

-- CreateIndex
CREATE INDEX "Project_strategicAreaId_idx" ON "Project"("strategicAreaId");

-- CreateIndex
CREATE INDEX "Project_leadId_idx" ON "Project"("leadId");

-- CreateIndex
CREATE INDEX "Project_coverId_idx" ON "Project"("coverId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTranslation_projectId_locale_key" ON "ProjectTranslation"("projectId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_slug_key" ON "Partner"("slug");

-- CreateIndex
CREATE INDEX "Partner_published_isDemo_featured_sortOrder_idx" ON "Partner"("published", "isDemo", "featured", "sortOrder");

-- CreateIndex
CREATE INDEX "Partner_logoId_idx" ON "Partner"("logoId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerTranslation_partnerId_locale_key" ON "PartnerTranslation"("partnerId", "locale");

-- CreateIndex
CREATE INDEX "ProjectPartner_partnerId_idx" ON "ProjectPartner"("partnerId");

-- CreateIndex
CREATE INDEX "ActivityPartner_partnerId_idx" ON "ActivityPartner"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "Publication_slug_key" ON "Publication"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Publication_doi_key" ON "Publication"("doi");

-- CreateIndex
CREATE INDEX "Publication_published_isDemo_status_type_publishedAt_idx" ON "Publication"("published", "isDemo", "status", "type", "publishedAt");

-- CreateIndex
CREATE INDEX "Publication_coverId_idx" ON "Publication"("coverId");

-- CreateIndex
CREATE INDEX "Publication_pdfId_idx" ON "Publication"("pdfId");

-- CreateIndex
CREATE INDEX "Publication_strategicAreaId_idx" ON "Publication"("strategicAreaId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationTranslation_publicationId_locale_key" ON "PublicationTranslation"("publicationId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationAuthor_slug_key" ON "PublicationAuthor"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationAuthor_orcid_key" ON "PublicationAuthor"("orcid");

-- CreateIndex
CREATE INDEX "PublicationAuthorship_authorId_idx" ON "PublicationAuthorship"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationAuthorship_publicationId_sortOrder_key" ON "PublicationAuthorship"("publicationId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMemberTranslation_teamMemberId_locale_key" ON "TeamMemberTranslation"("teamMemberId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Expertise_slug_key" ON "Expertise"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertiseTranslation_expertiseId_locale_key" ON "ExpertiseTranslation"("expertiseId", "locale");

-- CreateIndex
CREATE INDEX "TeamMemberExpertise_expertiseId_idx" ON "TeamMemberExpertise"("expertiseId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_slug_key" ON "Document"("slug");

-- CreateIndex
CREATE INDEX "Document_public_published_isDemo_sortOrder_idx" ON "Document"("public", "published", "isDemo", "sortOrder");

-- CreateIndex
CREATE INDEX "Document_fileId_idx" ON "Document"("fileId");

-- CreateIndex
CREATE INDEX "DocumentTranslation_fileId_idx" ON "DocumentTranslation"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTranslation_documentId_locale_key" ON "DocumentTranslation"("documentId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "StrategicArea_slug_key" ON "StrategicArea"("slug");

-- CreateIndex
CREATE INDEX "StrategicArea_published_isDemo_sortOrder_idx" ON "StrategicArea"("published", "isDemo", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "StrategicAreaTranslation_strategicAreaId_locale_key" ON "StrategicAreaTranslation"("strategicAreaId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_confirmationTokenHash_key" ON "NewsletterSubscriber"("confirmationTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_unsubscribeTokenHash_key" ON "NewsletterSubscriber"("unsubscribeTokenHash");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_status_locale_idx" ON "NewsletterSubscriber"("status", "locale");

-- CreateIndex
CREATE INDEX "ProjectActivity_activityId_idx" ON "ProjectActivity"("activityId");

-- CreateIndex
CREATE INDEX "ProjectPublication_publicationId_idx" ON "ProjectPublication"("publicationId");

-- CreateIndex
CREATE INDEX "ProjectDocument_documentId_idx" ON "ProjectDocument"("documentId");

-- CreateIndex
CREATE INDEX "ActivityDocument_documentId_idx" ON "ActivityDocument"("documentId");

-- CreateIndex
CREATE INDEX "PublicationDocument_documentId_idx" ON "PublicationDocument"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_slug_key" ON "TeamMember"("slug");

-- CreateIndex
CREATE INDEX "TeamMember_category_published_isDemo_order_idx" ON "TeamMember"("category", "published", "isDemo", "order");

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_portraitId_fkey" FOREIGN KEY ("portraitId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageSEO" ADD CONSTRAINT "PageSEO_openGraphImageId_fkey" FOREIGN KEY ("openGraphImageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaTranslation" ADD CONSTRAINT "MediaTranslation_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityCategoryTranslation" ADD CONSTRAINT "ActivityCategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ActivityCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ActivityCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_strategicAreaId_fkey" FOREIGN KEY ("strategicAreaId") REFERENCES "StrategicArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityTranslation" ADD CONSTRAINT "ActivityTranslation_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityImage" ADD CONSTRAINT "ActivityImage_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityImage" ADD CONSTRAINT "ActivityImage_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCategoryTranslation" ADD CONSTRAINT "ProjectCategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProjectCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProjectCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_strategicAreaId_fkey" FOREIGN KEY ("strategicAreaId") REFERENCES "StrategicArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTranslation" ADD CONSTRAINT "ProjectTranslation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerTranslation" ADD CONSTRAINT "PartnerTranslation_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPartner" ADD CONSTRAINT "ProjectPartner_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPartner" ADD CONSTRAINT "ProjectPartner_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityPartner" ADD CONSTRAINT "ActivityPartner_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityPartner" ADD CONSTRAINT "ActivityPartner_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_pdfId_fkey" FOREIGN KEY ("pdfId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_strategicAreaId_fkey" FOREIGN KEY ("strategicAreaId") REFERENCES "StrategicArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationTranslation" ADD CONSTRAINT "PublicationTranslation_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationAuthorship" ADD CONSTRAINT "PublicationAuthorship_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationAuthorship" ADD CONSTRAINT "PublicationAuthorship_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "PublicationAuthor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMemberTranslation" ADD CONSTRAINT "TeamMemberTranslation_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertiseTranslation" ADD CONSTRAINT "ExpertiseTranslation_expertiseId_fkey" FOREIGN KEY ("expertiseId") REFERENCES "Expertise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMemberExpertise" ADD CONSTRAINT "TeamMemberExpertise_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMemberExpertise" ADD CONSTRAINT "TeamMemberExpertise_expertiseId_fkey" FOREIGN KEY ("expertiseId") REFERENCES "Expertise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTranslation" ADD CONSTRAINT "DocumentTranslation_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTranslation" ADD CONSTRAINT "DocumentTranslation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrategicAreaTranslation" ADD CONSTRAINT "StrategicAreaTranslation_strategicAreaId_fkey" FOREIGN KEY ("strategicAreaId") REFERENCES "StrategicArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectActivity" ADD CONSTRAINT "ProjectActivity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectActivity" ADD CONSTRAINT "ProjectActivity_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPublication" ADD CONSTRAINT "ProjectPublication_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPublication" ADD CONSTRAINT "ProjectPublication_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityDocument" ADD CONSTRAINT "ActivityDocument_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityDocument" ADD CONSTRAINT "ActivityDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationDocument" ADD CONSTRAINT "PublicationDocument_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationDocument" ADD CONSTRAINT "PublicationDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Preserve existing team records when introducing stable slugs.
UPDATE "TeamMember" SET "slug" = 'legacy-' || "id" WHERE "slug" IS NULL;
ALTER TABLE "TeamMember" ALTER COLUMN "slug" SET NOT NULL;
