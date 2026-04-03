import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MountType } from "@/generated/prisma/client";
import { BreedingSimulator } from "@/components/BreedingSimulator";

interface PageProps {
  searchParams: Promise<{
    type?: string;
  }>;
}

export default async function BreedingPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const mountType = (params.type as MountType) || MountType.MULDO;

  // Validate mount type
  const validTypes = Object.values(MountType);
  const selectedType = validTypes.includes(mountType) ? mountType : MountType.MULDO;

  // Fetch all mounts of selected type with their parents
  const mounts = await prisma.mount.findMany({
    where: { type: selectedType },
    include: {
      parent1: true,
      parent2: true,
    },
    orderBy: [{ generation: "asc" }, { name: "asc" }],
  });

  // Fetch user's mounts for this type
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

  const typeLabels: Record<MountType, string> = {
    [MountType.MULDO]: "Muldo",
    [MountType.DRAGODINDE]: "Dragodinde",
    [MountType.VOLKORNE]: "Volkorne",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Simulateur d'Élevage</h1>
        <p className="text-muted-foreground">
          Sélectionnez un {typeLabels[selectedType]} cible pour voir l'arbre de reproduction complet
          et les montures nécessaires.
        </p>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <BreedingSimulator
          mounts={mounts}
          userMounts={userMounts}
          currentType={selectedType}
        />
      </Suspense>
    </div>
  );
}
