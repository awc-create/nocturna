/*
  Warnings:

  - You are about to drop the column `ctaGhostHref` on the `AboutUs` table. All the data in the column will be lost.
  - You are about to drop the column `ctaGhostText` on the `AboutUs` table. All the data in the column will be lost.
  - You are about to drop the column `ctaPrimaryHref` on the `AboutUs` table. All the data in the column will be lost.
  - You are about to drop the column `ctaPrimaryText` on the `AboutUs` table. All the data in the column will be lost.
  - You are about to drop the column `eyebrow` on the `AboutUs` table. All the data in the column will be lost.
  - You are about to drop the column `lead` on the `AboutUs` table. All the data in the column will be lost.
  - You are about to drop the column `quickFacts` on the `AboutUs` table. All the data in the column will be lost.
  - You are about to drop the `HomeDonation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HomeGallery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HomeMission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HomeTestimonial` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `description` to the `AboutUs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AboutUs" DROP COLUMN "ctaGhostHref",
DROP COLUMN "ctaGhostText",
DROP COLUMN "ctaPrimaryHref",
DROP COLUMN "ctaPrimaryText",
DROP COLUMN "eyebrow",
DROP COLUMN "lead",
DROP COLUMN "quickFacts",
ADD COLUMN     "description" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."HomeDonation";

-- DropTable
DROP TABLE "public"."HomeGallery";

-- DropTable
DROP TABLE "public"."HomeMission";

-- DropTable
DROP TABLE "public"."HomeTestimonial";

-- CreateTable
CREATE TABLE "HomeAbout" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'about',
    "eyebrow" TEXT NOT NULL DEFAULT 'ABOUT Essentia',
    "title" TEXT NOT NULL,
    "lead" TEXT NOT NULL,
    "bullets" TEXT[],
    "ctaPrimaryText" TEXT NOT NULL DEFAULT 'Learn more',
    "ctaPrimaryHref" TEXT NOT NULL DEFAULT '/about',
    "ctaGhostText" TEXT NOT NULL DEFAULT 'Enquire now',
    "ctaGhostHref" TEXT NOT NULL DEFAULT '/enquire',
    "quickFacts" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeAbout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeServices" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'services',
    "kicker" TEXT NOT NULL DEFAULT 'Our Services',
    "title" TEXT NOT NULL DEFAULT 'Sound that fits the room.',
    "lead" TEXT NOT NULL DEFAULT 'Two core offerings to start — built to scale with your brand.',
    "items" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeServices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomeAbout_key_key" ON "HomeAbout"("key");

-- CreateIndex
CREATE UNIQUE INDEX "HomeServices_key_key" ON "HomeServices"("key");
