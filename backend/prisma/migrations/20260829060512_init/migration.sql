-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "gender" TEXT,
    "goal" TEXT,
    "age" INTEGER,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "targetWeight" DOUBLE PRECISION,
    "frequency" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'inactive',
    "bmi" DOUBLE PRECISION,
    "dailyCalories" INTEGER,
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_sessionId_key" ON "User"("sessionId");
