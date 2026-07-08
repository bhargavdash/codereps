-- DropIndex
DROP INDEX "challenges_tags_gin_idx";

-- AlterTable
ALTER TABLE "user_challenge_progress" ADD COLUMN     "last_passed_at" TIMESTAMPTZ;

-- CreateTable
CREATE TABLE "warmup_sessions" (
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "challenge_ids" UUID[],
    "kinds" TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warmup_sessions_pkey" PRIMARY KEY ("user_id","date")
);

-- AddForeignKey
ALTER TABLE "warmup_sessions" ADD CONSTRAINT "warmup_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
