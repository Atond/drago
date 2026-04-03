import { MountCard } from "./MountCard";

interface Mount {
  id: number;
  name: string;
  generation: number;
  bonus: string | null;
  imageUrl: string | null;
  parent1?: { name: string } | null;
  parent2?: { name: string } | null;
}

interface UserMount {
  mountId: number;
  maleCount: number;
  femaleCount: number;
}

interface MountGridProps {
  mounts: Mount[];
  userMounts: UserMount[];
  groupByGeneration?: boolean;
  mountType: string;
}

export function MountGrid({
  mounts,
  userMounts,
  groupByGeneration = true,
  mountType,
}: MountGridProps) {
  const userMountMap = new Map(
    userMounts.map((um) => [um.mountId, um])
  );

  if (mounts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucune monture trouvée avec ces filtres.
      </div>
    );
  }

  if (groupByGeneration) {
    const generations = Array.from(
      new Set(mounts.map((m) => m.generation))
    ).sort((a, b) => a - b);

    return (
      <div className="space-y-8">
        {generations.map((gen) => {
          const genMounts = mounts.filter((m) => m.generation === gen);
          const targetPerGender = gen === 1 ? 1 : 2;
          const genAtTarget = genMounts.filter((m) => {
            const um = userMountMap.get(m.id);
            return um && um.maleCount >= targetPerGender && um.femaleCount >= targetPerGender;
          }).length;
          const genComplete = genMounts.filter((m) => {
            const um = userMountMap.get(m.id);
            return um && um.maleCount > 0 && um.femaleCount > 0;
          }).length;

          return (
            <section key={gen}>
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold">Génération {gen}</h2>
                <span className="text-sm text-muted-foreground">
                  {genAtTarget}/{genMounts.length} objectif atteint
                  {genComplete > genAtTarget && ` (${genComplete} avec au moins 1 paire)`}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {genMounts.map((mount) => (
                  <MountCard
                    key={mount.id}
                    mount={mount}
                    userMount={userMountMap.get(mount.id)}
                    mountType={mountType}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {mounts.map((mount) => (
        <MountCard
          key={mount.id}
          mount={mount}
          userMount={userMountMap.get(mount.id)}
          mountType={mountType}
        />
      ))}
    </div>
  );
}
