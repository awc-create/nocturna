-- CreateTable
CREATE TABLE "HomeContact" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'contact',
    "title" TEXT NOT NULL DEFAULT 'Send us a message.',
    "description" TEXT NOT NULL DEFAULT 'We’ll get back to you shortly.',
    "submitLabel" TEXT NOT NULL DEFAULT 'Send Message',
    "successMessage" TEXT NOT NULL DEFAULT 'Thanks — we’ll be in touch soon.',
    "recipientEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomeContact_key_key" ON "HomeContact"("key");
