-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personality" TEXT[],
    "learningStyle" TEXT[],
    "knowledgeLevel" JSONB NOT NULL,
    "subjects" TEXT[],
    "availability" JSONB NOT NULL,
    "academicGoals" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCredits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vapiMinutesRemaining" INTEGER NOT NULL DEFAULT 0,
    "dailyMinutesRemaining" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCredits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "dailyRoomUrl" TEXT NOT NULL,
    "recordingUrl" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionAnalysis" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "transcriptUrl" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "topics" TEXT[],
    "participantMetrics" JSONB NOT NULL,
    "knowledgeDemonstrated" JSONB NOT NULL,
    "profileUpdates" JSONB NOT NULL,
    "flashcardsGenerated" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "stripePaymentId" TEXT NOT NULL,
    "vapiMinutes" INTEGER NOT NULL,
    "dailyMinutes" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "usage" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CachedImage" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "keywords" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CachedImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SessionParticipants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SessionParticipants_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCredits_userId_key" ON "UserCredits"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionAnalysis_sessionId_key" ON "SessionAnalysis"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditTransaction_stripePaymentId_key" ON "CreditTransaction"("stripePaymentId");

-- CreateIndex
CREATE INDEX "CachedImage_topic_subject_idx" ON "CachedImage"("topic", "subject");

-- CreateIndex
CREATE INDEX "CachedImage_keywords_idx" ON "CachedImage"("keywords");

-- CreateIndex
CREATE INDEX "_SessionParticipants_B_index" ON "_SessionParticipants"("B");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCredits" ADD CONSTRAINT "UserCredits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionAnalysis" ADD CONSTRAINT "SessionAnalysis_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageLog" ADD CONSTRAINT "UsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SessionParticipants" ADD CONSTRAINT "_SessionParticipants_A_fkey" FOREIGN KEY ("A") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SessionParticipants" ADD CONSTRAINT "_SessionParticipants_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
