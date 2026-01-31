-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('VIDEO', 'IMAGE');

-- CreateTable
CREATE TABLE "HeroHome" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'home',
    "mediaType" "MediaType" NOT NULL DEFAULT 'VIDEO',
    "imageSrc" TEXT NOT NULL DEFAULT '/assets/hero.png',
    "videoSrc" TEXT,
    "posterSrc" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Your Modern Website Starts Here',
    "description" TEXT NOT NULL DEFAULT 'Crafted with performance and style in mind...',
    "ctaText" TEXT NOT NULL DEFAULT 'APPLY FOR MEMBERSHIP',
    "ctaHref" TEXT NOT NULL DEFAULT '/apply',
    "overlayDarkness" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroHome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeMission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'mission',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "familiesHoused" INTEGER NOT NULL DEFAULT 0,
    "childrenInCare" INTEGER NOT NULL DEFAULT 0,
    "mealsServed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeGallery" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'gallery',
    "imageUrls" TEXT[],
    "title" TEXT,
    "subtitle" TEXT,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeGallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeTestimonial" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'testimonial',
    "quote" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "role" TEXT,
    "avatarSrc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeTestimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeDonation" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'donation',
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeDonation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AboutUs" (
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
    "meta1Value" TEXT NOT NULL DEFAULT '200+',
    "meta1Label" TEXT NOT NULL DEFAULT 'Gigs curated',
    "meta2Value" TEXT NOT NULL DEFAULT 'UK-wide',
    "meta2Label" TEXT NOT NULL DEFAULT 'Venue coverage',
    "meta3Value" TEXT NOT NULL DEFAULT 'DJs & Musicians',
    "meta3Label" TEXT NOT NULL DEFAULT 'Tailored rosters',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AboutUs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactPage" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'contact',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "submitLabel" TEXT NOT NULL,
    "successMessage" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'unknown',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HeroHome_key_key" ON "HeroHome"("key");

-- CreateIndex
CREATE UNIQUE INDEX "HomeMission_key_key" ON "HomeMission"("key");

-- CreateIndex
CREATE UNIQUE INDEX "HomeGallery_key_key" ON "HomeGallery"("key");

-- CreateIndex
CREATE UNIQUE INDEX "HomeTestimonial_key_key" ON "HomeTestimonial"("key");

-- CreateIndex
CREATE UNIQUE INDEX "HomeDonation_key_key" ON "HomeDonation"("key");

-- CreateIndex
CREATE UNIQUE INDEX "AboutUs_key_key" ON "AboutUs"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ContactPage_key_key" ON "ContactPage"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Media_url_key" ON "Media"("url");

-- CreateIndex
CREATE INDEX "Media_name_idx" ON "Media"("name");
