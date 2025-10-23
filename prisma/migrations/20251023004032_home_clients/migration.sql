-- CreateTable
CREATE TABLE "HomeClients" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'clients',
    "title" TEXT NOT NULL DEFAULT 'Our Clients',
    "subtitle" TEXT NOT NULL DEFAULT 'Trusted by leading venues, bars and creative brands.',
    "items" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeClients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomeClients_key_key" ON "HomeClients"("key");
