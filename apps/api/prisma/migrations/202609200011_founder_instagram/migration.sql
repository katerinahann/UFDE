ALTER TABLE "TeamMember" ADD COLUMN "instagram" TEXT;
UPDATE "TeamMember" SET "instagram"='https://www.instagram.com/dr_hannouf_kateryna/',"updatedAt"=CURRENT_TIMESTAMP WHERE "slug"='kateryna-hannouf';
UPDATE "TeamMember" SET "instagram"='https://www.instagram.com/volodymyr_kogutyak/',"updatedAt"=CURRENT_TIMESTAMP WHERE "slug"='volodymyr-kohutiak';
