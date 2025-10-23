/*
  Warnings:

  - You are about to drop the column `meta1Label` on the `AboutUs` table. All the data in the column will be lost.
  - You are about to drop the column `meta1Value` on the `AboutUs` table. All the data in the column will be lost.
  - You are about to drop the column `meta2Label` on the `AboutUs` table. All the data in the column will be lost.
  - You are about to drop the column `meta2Value` on the `AboutUs` table. All the data in the column will be lost.
  - You are about to drop the column `meta3Label` on the `AboutUs` table. All the data in the column will be lost.
  - You are about to drop the column `meta3Value` on the `AboutUs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AboutUs" DROP COLUMN "meta1Label",
DROP COLUMN "meta1Value",
DROP COLUMN "meta2Label",
DROP COLUMN "meta2Value",
DROP COLUMN "meta3Label",
DROP COLUMN "meta3Value",
ADD COLUMN     "quickFacts" JSONB NOT NULL DEFAULT '[]';
