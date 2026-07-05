-- GIN index for tag-filtered challenge queries (tags: { has: ... }).
-- Raw SQL because Prisma does not model GIN indexes natively (board S1-5,
-- deferred from S0-5 until tag queries existed — they do now).
CREATE INDEX IF NOT EXISTS "challenges_tags_gin_idx" ON "challenges" USING GIN ("tags");
