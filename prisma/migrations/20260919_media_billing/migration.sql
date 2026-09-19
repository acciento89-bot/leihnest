-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('PROFILE', 'GROUP', 'ITEM');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTH', 'YEAR');

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'image/webp',
    "sourceBytes" INTEGER NOT NULL,
    "sourceWidth" INTEGER NOT NULL,
    "sourceHeight" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    "groupId" TEXT,
    "itemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MediaAsset_exactly_one_owner" CHECK (
      (CASE WHEN "userId" IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN "groupId" IS NOT NULL AND "itemId" IS NULL THEN 1 ELSE 0 END) +
      (CASE WHEN "itemId" IS NOT NULL THEN 1 ELSE 0 END) = 1
    )
);

-- CreateTable
CREATE TABLE "GroupSubscription" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "stripeCheckoutExpiresAt" TIMESTAMP(3),
    "interval" "BillingInterval",
    "status" TEXT NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "stripeUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedStripeEvent" (
    "id" TEXT NOT NULL,
    "stripeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedStripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");
CREATE INDEX "MediaAsset_userId_kind_idx" ON "MediaAsset"("userId", "kind");
CREATE INDEX "MediaAsset_groupId_kind_idx" ON "MediaAsset"("groupId", "kind");
CREATE INDEX "MediaAsset_itemId_position_idx" ON "MediaAsset"("itemId", "position");

CREATE UNIQUE INDEX "GroupSubscription_groupId_key" ON "GroupSubscription"("groupId");
CREATE UNIQUE INDEX "GroupSubscription_stripeCustomerId_key" ON "GroupSubscription"("stripeCustomerId");
CREATE UNIQUE INDEX "GroupSubscription_stripeSubscriptionId_key" ON "GroupSubscription"("stripeSubscriptionId");
CREATE UNIQUE INDEX "GroupSubscription_stripeCheckoutSessionId_key" ON "GroupSubscription"("stripeCheckoutSessionId");

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupSubscription" ADD CONSTRAINT "GroupSubscription_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
