import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MountType } from "@/generated/prisma/client";
import { BreedingOptimizer } from "@/components/BreedingOptimizer";

interface PageProps {
  searchParams: Promise<{
    type?: string;
    target?: string;
  }>;
}

export default async function OptimizerPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const mountType = (params.type as MountType) || MountType.MULDO;
  const targetId = params.target ? parseInt(params.target) : null;

  // Validate mount type
  const validTypes = Object.values(MountType);
  const selectedType = validTypes.includes(mountType) ? mountType : MountType.MULDO;

  // Fetch all mounts of selected type
  const mounts = await prisma.mount.findMany({
    where: { type: selectedType },
    include: {
      parent1: true,
      parent2: true,
    },
    orderBy: [{ generation: "asc" }, { name: "asc" }],
  });

  // Fetch user's mounts
  const userMounts = await prisma.userMount.findMany({
    where: {
      userId: session.user.id,
      mount: { type: selectedType },
    },
    select: {
      mountId: true,
      maleCount: true,
      femaleCount: true,
    },
  });

  // Fetch saved breeding plans (all types)
  const savedPlans = await prisma.breedingPlan.findMany({
    where: { userId: session.user.id },
    include: { mount: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Optimiseur d'Élevage</h1>
        <p className="text-muted-foreground">
          Calculez exactement combien de montures, d'XP et de ressources vous aurez besoin
          pour obtenir votre monture cible.
        </p>
      </div>

      <BreedingOptimizer
        mounts={mounts}
        userMounts={userMounts}
        currentType={selectedType}
        initialTargetId={targetId}
        savedPlans={savedPlans}
      />
    </div>
  );
}
