import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MountType } from "@/generated/prisma/client";
import { MountGrid } from "@/components/MountGrid";
import { MountFilters } from "@/components/MountFilters";

const MOUNT_CONFIG: Record<string, { type: MountType; title: string; description: string }> = {
  muldos: {
    type: MountType.MULDO,
    title: "Ma Collection de Muldos",
    description: "Suivez votre progression d'élevage de Muldos",
  },
  dragodindes: {
    type: MountType.DRAGODINDE,
    title: "Ma Collection de Dragodindes",
    description: "Suivez votre progression d'élevage de Dragodindes",
  },
  volkornes: {
    type: MountType.VOLKORNE,
    title: "Ma Collection de Volkornes",
    description: "Suivez votre progression d'élevage de Volkornes",
  },
};

interface PageProps {
  params: Promise<{ type: string }>;
  searchParams: Promise<{
    generation?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function MountsPage({ params, searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { type } = await params;
  const config = MOUNT_CONFIG[type];

  if (!config) {
    notFound();
  }

  const search = await searchParams;
  const { generation, status, search: searchQuery } = search;

  // Fetch all mounts of this type with parents
  const allMounts = await prisma.mount.findMany({
    where: { type: config.type },
    select: {
      id: true,
      name: true,
      generation: true,
      bonus: true,
      imageUrl: true,
      breedingCombinations: true,
      parent1: { select: { name: true } },
      parent2: { select: { name: true } },
    },
    orderBy: [{ generation: "asc" }, { name: "asc" }],
  });

  // Fetch user's mounts for this type
  const userMounts = await prisma.userMount.findMany({
    where: {
      userId: session.user.id,
      mount: { type: config.type },
    },
    select: {
      mountId: true,
      maleCount: true,
      femaleCount: true,
    },
  });

  const userMountMap = new Map(userMounts.map((um) => [um.mountId, um]));

  // Apply filters
  let filteredMounts = allMounts;

  // Filter by generation
  if (generation && generation !== "all") {
    const gen = parseInt(generation);
    filteredMounts = filteredMounts.filter((m) => m.generation === gen);
  }

  // Filter by status
  if (status && status !== "all") {
    filteredMounts = filteredMounts.filter((m) => {
      const um = userMountMap.get(m.id);
      const maleCount = um?.maleCount ?? 0;
      const femaleCount = um?.femaleCount ?? 0;
      const isOwned = maleCount > 0 || femaleCount > 0;
      const isComplete = maleCount > 0 && femaleCount > 0;

      switch (status) {
        case "owned":
          return isOwned;
        case "missing":
          return !isOwned;
        case "complete":
          return isComplete;
        default:
          return true;
      }
    });
  }

  // Filter by search
  if (searchQuery) {
    const searchLower = searchQuery.toLowerCase();
    filteredMounts = filteredMounts.filter((m) =>
      m.name.toLowerCase().includes(searchLower)
    );
  }

  // Calculate stats
  const totalCount = allMounts.length;
  const ownedCount = allMounts.filter((m) => {
    const um = userMountMap.get(m.id);
    return (um?.maleCount ?? 0) > 0 || (um?.femaleCount ?? 0) > 0;
  }).length;
  const completeCount = allMounts.filter((m) => {
    const um = userMountMap.get(m.id);
    return (um?.maleCount ?? 0) > 0 && (um?.femaleCount ?? 0) > 0;
  }).length;

  // Total individual mounts count
  const totalMountsOwned = userMounts.reduce(
    (acc, um) => acc + um.maleCount + um.femaleCount,
    0
  );

  // Get unique generations for filter
  const generations = [...new Set(allMounts.map((m) => m.generation))].sort((a, b) => a - b);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{config.title}</h1>
        <p className="text-muted-foreground">{config.description}</p>
      </div>

      <Suspense fallback={<div>Chargement des filtres...</div>}>
        <MountFilters
          totalCount={totalCount}
          ownedCount={ownedCount}
          completeCount={completeCount}
          totalMountsOwned={totalMountsOwned}
          generations={generations}
        />
      </Suspense>

      <div className="mt-8">
        <MountGrid
          mounts={filteredMounts}
          userMounts={userMounts}
          groupByGeneration={!generation || generation === "all"}
          mountType={type}
        />
      </div>
    </div>
  );
}
