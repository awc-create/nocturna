/*
  Warnings:

  - You are about to drop the `AboutUs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."AboutUs";

-- CreateTable
CREATE TABLE "HeroAbout" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'about',
    "mediaType" "MediaType" NOT NULL DEFAULT 'VIDEO',
    "imageSrc" TEXT NOT NULL DEFAULT '/assets/about-hero.jpg',
    "videoSrc" TEXT,
    "posterSrc" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Alex & Alin — Who We Are',
    "description" TEXT NOT NULL DEFAULT 'Nocturna curates DJs and live acts to shape atmosphere-first nights for venues and brands.',
    "ctaText" TEXT NOT NULL DEFAULT 'WORK WITH US',
    "ctaHref" TEXT NOT NULL DEFAULT '/apply',
    "overlayDarkness" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroAbout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HeroAbout_key_key" ON "HeroAbout"("key");
