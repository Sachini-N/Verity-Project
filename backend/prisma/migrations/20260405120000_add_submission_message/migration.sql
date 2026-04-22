-- Add optional student message/note for assignment submissions
ALTER TABLE "AssignmentSubmission"
ADD COLUMN IF NOT EXISTS "submissionMessage" TEXT;
