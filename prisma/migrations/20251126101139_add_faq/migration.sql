-- CreateTable
CREATE TABLE "FaqPage" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'faq',
    "eyebrow" TEXT NOT NULL DEFAULT 'Help centre',
    "title" TEXT NOT NULL DEFAULT 'Frequently asked questions.',
    "lead" TEXT NOT NULL DEFAULT 'A quick guide for venues, events and artists working with Essentia. If you can’t find what you’re looking for, just get in touch.',
    "items" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FaqPage_key_key" ON "FaqPage"("key");
