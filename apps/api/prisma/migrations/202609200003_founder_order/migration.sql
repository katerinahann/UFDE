UPDATE "TeamMember" SET "order" = 3, "updatedAt" = CURRENT_TIMESTAMP WHERE "slug" = 'volodymyr-kohutiak';
UPDATE "TeamMember" SET "order" = GREATEST(4, (SELECT COALESCE(MAX("order"), 3) + 1 FROM "TeamMember" WHERE "slug" <> 'anna-golovkova')), "updatedAt" = CURRENT_TIMESTAMP WHERE "slug" = 'anna-golovkova';
