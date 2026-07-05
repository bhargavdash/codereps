-- CreateEnum
CREATE TYPE "Category" AS ENUM ('react', 'dsa', 'typescript', 'javascript', 'css');

-- CreateEnum
CREATE TYPE "Mode" AS ENUM ('pattern_drill', 'syntax_sprint', 'component_recall', 'interview_sim');

-- CreateEnum
CREATE TYPE "Runner" AS ENUM ('js_worker', 'react_iframe', 'ts_check', 'css_iframe');

-- CreateEnum
CREATE TYPE "SubStatus" AS ENUM ('passed', 'failed', 'error', 'timeout', 'abandoned');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" TEXT NOT NULL,
    "display_name" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "mode" "Mode" NOT NULL,
    "difficulty" SMALLINT NOT NULL,
    "runner" "Runner" NOT NULL,
    "language" TEXT NOT NULL,
    "prompt_md" TEXT NOT NULL,
    "starter_code" TEXT NOT NULL,
    "solution_code" TEXT NOT NULL,
    "solution_notes_md" TEXT,
    "tests" JSONB NOT NULL,
    "par_seconds" INTEGER NOT NULL,
    "time_limit_seconds" INTEGER NOT NULL,
    "tags" TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "challenge_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attempt_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "challenge_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "status" "SubStatus" NOT NULL,
    "tests_passed" INTEGER NOT NULL DEFAULT 0,
    "tests_total" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER NOT NULL,
    "keystrokes" INTEGER NOT NULL DEFAULT 0,
    "paste_attempts" INTEGER NOT NULL DEFAULT 0,
    "fluency_score" DECIMAL(5,2),
    "trace" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_challenge_progress" (
    "user_id" UUID NOT NULL,
    "challenge_id" UUID NOT NULL,
    "attempts_count" INTEGER NOT NULL DEFAULT 0,
    "passes_count" INTEGER NOT NULL DEFAULT 0,
    "best_fluency" DECIMAL(5,2),
    "ema_fluency" DECIMAL(5,2),
    "last_attempted_at" TIMESTAMPTZ,
    "first_passed_at" TIMESTAMPTZ,
    "srs_interval_days" INTEGER NOT NULL DEFAULT 0,
    "srs_ease" DECIMAL(3,2) NOT NULL DEFAULT 2.5,
    "next_review_at" TIMESTAMPTZ,

    CONSTRAINT "user_challenge_progress_pkey" PRIMARY KEY ("user_id","challenge_id")
);

-- CreateTable
CREATE TABLE "daily_activity" (
    "user_id" UUID NOT NULL,
    "activity_date" DATE NOT NULL,
    "submissions" INTEGER NOT NULL DEFAULT 0,
    "passes" INTEGER NOT NULL DEFAULT 0,
    "minutes_active" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "daily_activity_pkey" PRIMARY KEY ("user_id","activity_date")
);

-- CreateTable
CREATE TABLE "streaks" (
    "user_id" UUID NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "longest" INTEGER NOT NULL DEFAULT 0,
    "last_active_date" DATE,

    CONSTRAINT "streaks_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_username_key" ON "profiles"("username");

-- CreateIndex
CREATE UNIQUE INDEX "challenges_slug_key" ON "challenges"("slug");

-- CreateIndex
CREATE INDEX "challenges_category_difficulty_idx" ON "challenges"("category", "difficulty");

-- CreateIndex
CREATE INDEX "attempts_user_id_challenge_id_idx" ON "attempts"("user_id", "challenge_id");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_attempt_id_key" ON "submissions"("attempt_id");

-- CreateIndex
CREATE INDEX "submissions_user_id_created_at_idx" ON "submissions"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "submissions_user_id_challenge_id_created_at_idx" ON "submissions"("user_id", "challenge_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "user_challenge_progress_user_id_next_review_at_idx" ON "user_challenge_progress"("user_id", "next_review_at");

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_challenge_progress" ADD CONSTRAINT "user_challenge_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_challenge_progress" ADD CONSTRAINT "user_challenge_progress_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_activity" ADD CONSTRAINT "daily_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
