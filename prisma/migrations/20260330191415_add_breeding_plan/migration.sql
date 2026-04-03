-- CreateTable
CREATE TABLE "BreedingPlan" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "mountId" INTEGER NOT NULL,
    "parentLevel" INTEGER NOT NULL DEFAULT 1,
    "xpTier" INTEGER NOT NULL DEFAULT 1,
    "numEnclosures" INTEGER NOT NULL DEFAULT 1,
    "gen1Multiplier" INTEGER NOT NULL DEFAULT 1,
    "useCloning" BOOLEAN NOT NULL DEFAULT false,
    "useOptimakina" BOOLEAN NOT NULL DEFAULT false,
    "useReproducteur" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BreedingPlan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BreedingPlan" ADD CONSTRAINT "BreedingPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreedingPlan" ADD CONSTRAINT "BreedingPlan_mountId_fkey" FOREIGN KEY ("mountId") REFERENCES "Mount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
