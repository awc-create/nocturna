-- CreateTable
CREATE TABLE "HomeEnquire" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'enquire',
    "eyebrow" TEXT NOT NULL DEFAULT 'For venues & events',
    "title" TEXT NOT NULL DEFAULT 'Enquire about DJs and live music.',
    "lead" TEXT NOT NULL DEFAULT 'We curate DJs and musicians for restaurants, bars and event spaces — matching artists to your brand, guest profile and schedule.',
    "buttonLabel" TEXT NOT NULL DEFAULT 'Open enquiry form',
    "modalKicker" TEXT NOT NULL DEFAULT 'Enquire Now',
    "modalTitle" TEXT NOT NULL DEFAULT 'Tell us about your venue or event.',
    "modalLead" TEXT NOT NULL DEFAULT 'Share a few details about your space, schedule and music brief — we’ll match you with the right artists.',
    "successMessage" TEXT NOT NULL DEFAULT 'Thanks — we’ll be in touch shortly.',
    "formFields" JSONB NOT NULL DEFAULT '[]',
    "recipientEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeEnquire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeJoin" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'join',
    "eyebrow" TEXT NOT NULL DEFAULT 'For artists & collectives',
    "title" TEXT NOT NULL DEFAULT 'Join the Essentia roster.',
    "lead" TEXT NOT NULL DEFAULT 'DJs, musicians and live acts who care about atmosphere, consistency and good hospitality.',
    "buttonLabel" TEXT NOT NULL DEFAULT 'Open application form',
    "modalKicker" TEXT NOT NULL DEFAULT 'Join Essentia',
    "modalTitle" TEXT NOT NULL DEFAULT 'Tell us about your sound.',
    "modalLead" TEXT NOT NULL DEFAULT 'Share links, socials and a short intro — we’ll review and get back if there’s a fit.',
    "successMessage" TEXT NOT NULL DEFAULT 'Thanks — we’ll review your submission and follow up.',
    "formFields" JSONB NOT NULL DEFAULT '[]',
    "recipientEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeJoin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomeEnquire_key_key" ON "HomeEnquire"("key");

-- CreateIndex
CREATE UNIQUE INDEX "HomeJoin_key_key" ON "HomeJoin"("key");
