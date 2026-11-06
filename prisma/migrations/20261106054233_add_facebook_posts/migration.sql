-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectedPage" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "pageName" TEXT NOT NULL,
    "pageCategory" TEXT,
    "pageAccessToken" TEXT NOT NULL,
    "instagramId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectedPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacebookPost" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "pageName" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "createdTime" TIMESTAMP(3) NOT NULL,
    "permalinkUrl" TEXT,
    "fullPicture" TEXT,
    "statusType" TEXT,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "reactions" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "isMock" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacebookPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "objective" TEXT NOT NULL,
    "objectiveText" TEXT NOT NULL,
    "specialCategory" TEXT NOT NULL DEFAULT 'NONE',
    "location" TEXT NOT NULL,
    "radiusKm" INTEGER NOT NULL DEFAULT 15,
    "targetAge" TEXT NOT NULL DEFAULT '25 - 45',
    "targetGender" TEXT NOT NULL DEFAULT 'FEMALE',
    "targetInterests" TEXT,
    "dailyBudget" DOUBLE PRECISION NOT NULL DEFAULT 200000,
    "durationDays" INTEGER NOT NULL DEFAULT 7,
    "totalBudget" DOUBLE PRECISION NOT NULL DEFAULT 1400000,
    "maxEstimatedSpend" DOUBLE PRECISION NOT NULL DEFAULT 1750000,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "headline" TEXT NOT NULL,
    "primaryText" TEXT NOT NULL,
    "callToAction" TEXT NOT NULL DEFAULT 'SEND_MESSAGE',
    "pageName" TEXT NOT NULL DEFAULT 'Diệu BaHa - Quản Trị Thực Chiến',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "approvalCode" TEXT,
    "fingerprint" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "metaCampaignId" TEXT,
    "metaAdSetId" TEXT,
    "metaCreativeId" TEXT,
    "metaAdId" TEXT,
    "isMock" BOOLEAN NOT NULL DEFAULT true,
    "telegramSent" BOOLEAN NOT NULL DEFAULT false,
    "telegramSentAt" TIMESTAMP(3),
    "lastError" TEXT,
    "errorStep" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectedPage_userId_pageId_key" ON "ConnectedPage"("userId", "pageId");

-- CreateIndex
CREATE INDEX "FacebookPost_pageId_createdTime_idx" ON "FacebookPost"("pageId", "createdTime");

-- CreateIndex
CREATE UNIQUE INDEX "FacebookPost_pageId_postId_key" ON "FacebookPost"("pageId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_code_key" ON "Campaign"("code");

-- AddForeignKey
ALTER TABLE "ConnectedPage" ADD CONSTRAINT "ConnectedPage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
