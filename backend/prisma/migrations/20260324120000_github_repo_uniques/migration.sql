-- GithubRepo: one row per project + one GitHub owner/repo across the whole app

ALTER TABLE "GithubRepo" ADD COLUMN IF NOT EXISTS "repoFullName" TEXT;

UPDATE "GithubRepo"
SET "repoFullName" = LOWER(TRIM("owner") || '/' || TRIM("repoName"))
WHERE "repoFullName" IS NULL;

-- Drop rows that duplicate the same projectId (keep one row per project)
DELETE FROM "GithubRepo" a
USING "GithubRepo" b
WHERE a."projectId" = b."projectId" AND a."id" > b."id";

-- Drop rows that duplicate the same GitHub repo (keep smallest id)
DELETE FROM "GithubRepo" a
USING "GithubRepo" b
WHERE a."repoFullName" = b."repoFullName" AND a."id" > b."id";

ALTER TABLE "GithubRepo" ALTER COLUMN "repoFullName" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "GithubRepo_projectId_key" ON "GithubRepo"("projectId");
CREATE UNIQUE INDEX IF NOT EXISTS "GithubRepo_repoFullName_key" ON "GithubRepo"("repoFullName");
