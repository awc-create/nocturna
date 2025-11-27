-- AlterTable: add media fields to HomeAbout
ALTER TABLE "HomeAbout"
  ADD COLUMN "videoUrl" TEXT,
  ADD COLUMN "videoPoster" TEXT,
  ADD COLUMN "videoCaption" TEXT;
