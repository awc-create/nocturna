-- AlterTable
ALTER TABLE "HeroAbout" ADD COLUMN     "loopEndSec" DOUBLE PRECISION DEFAULT 10,
ADD COLUMN     "loopStartSec" DOUBLE PRECISION DEFAULT 4,
ADD COLUMN     "loopVideoSrc" TEXT,
ADD COLUMN     "startPausedForReturning" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "title" SET DEFAULT 'Adnan & Alin — Who We Are';
