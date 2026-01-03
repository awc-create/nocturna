/*
  Warnings:

  - You are about to drop the column `description` on the `HomeContact` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "HomeContact" DROP COLUMN "description",
ADD COLUMN     "buttonLabel" TEXT NOT NULL DEFAULT 'Open contact form',
ADD COLUMN     "eyebrow" TEXT NOT NULL DEFAULT 'Contact',
ADD COLUMN     "formFields" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "lead" TEXT NOT NULL DEFAULT 'We’ll get back to you shortly.',
ADD COLUMN     "modalKicker" TEXT NOT NULL DEFAULT 'Contact',
ADD COLUMN     "modalLead" TEXT NOT NULL DEFAULT 'We’ll get back to you shortly.',
ADD COLUMN     "modalTitle" TEXT NOT NULL DEFAULT 'Send us a message.';
