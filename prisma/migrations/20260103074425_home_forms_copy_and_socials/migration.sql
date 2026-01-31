/*
  Warnings:

  - You are about to drop the column `description` on the `HomeContact` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "HomeContact" DROP COLUMN "description",
ADD COLUMN     "contactEmail" TEXT NOT NULL DEFAULT 'info@Essentia.com',
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "socialLinks" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "HomeEnquire" ADD COLUMN     "submitLabel" TEXT NOT NULL DEFAULT 'Send enquiry';

-- AlterTable
ALTER TABLE "HomeJoin" ADD COLUMN     "submitLabel" TEXT NOT NULL DEFAULT 'Apply to join';
