"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BreedingTree } from "./BreedingTree";

interface Mount {
  id: number;
  name: string;
  generation: number;
  imageUrl: string | null;
  parent1Id: number | null;
  parent2Id: number | null;
  parent1: { id: number; name: string; imageUrl: string | null } | null;
  parent2: { id: number; name: string; imageUrl: string | null } | null;
}

interface UserMount {
  mountId: number;
  maleCount: number;
  femaleCount: number;
}

interface BreedingSimulatorProps {
  mounts: Mount[];
  userMounts: UserMount[];
  currentType: "MULDO" | "DRAGODINDE" | "VOLKORNE";
}

interface RequiredMount {
  mount: Mount;
  needed: number;
  owned: number;
}

const TYPE_CONFIG = {
  MULDO: { label: "Muldos", emoji: "🐏" },
  DRAGODINDE: { label: "Dragodindes", emoji: "🐉" },
  VOLKORNE: { label: "Volkornes", emoji: "🦏" },
};

export function BreedingSimulator({ mounts, userMounts, currentType }: BreedingSimulatorProps) {
  const router = useRouter();
  const [selectedMountId, setSelectedMountId] = useState<string>("");

  const mountMap = useMemo(() => {
    return new Map(mounts.map((m) => [m.id, m]));
  }, [mounts]);

  const userMountMap = useMemo(() => {
    return new Map(userMounts.map((um) => [um.mountId, um]));
  }, [userMounts]);

  const selectedMount = selectedMountId ? mountMap.get(parseInt(selectedMountId)) : null;

  // Calculate required base mounts recursively
  const calculateRequirements = useMemo(() => {
    if (!selectedMount) return { requirements: new Map<number, RequiredMount>(), tree: null };

    const requirements = new Map<number, RequiredMount>();

    // Build the tree and count requirements
    function buildTree(mount: Mount): object {
      const um = userMountMap.get(mount.id);
      const totalOwned = (um?.maleCount ?? 0) + (um?.femaleCount ?? 0);

      // Check if this is a base mount (no parents)
      if (!mount.parent1Id || !mount.parent2Id) {
        // Add to requirements
        const existing = requirements.get(mount.id);
        if (existing) {
          existing.needed++;
        } else {
          requirements.set(mount.id, {
            mount,
            needed: 1,
            owned: totalOwned,
          });
        }
        return {
          muldo: mount, // Keep 'muldo' for BreedingTree compatibility
          children: null,
          owned: totalOwned > 0,
          totalOwned,
        };
      }

      const parent1 = mountMap.get(mount.parent1Id)!;
      const parent2 = mountMap.get(mount.parent2Id)!;

      return {
        muldo: mount, // Keep 'muldo' for BreedingTree compatibility
        owned: totalOwned > 0,
        totalOwned,
        children: [
          buildTree(parent1),
          buildTree(parent2),
        ],
      };
    }

    const tree = buildTree(selectedMount);

    return { requirements, tree };
  }, [selectedMount, mountMap, userMountMap]);

  // Group mounts by generation for the select
  const mountsByGeneration = useMemo(() => {
    const grouped = new Map<number, Mount[]>();
    for (const mount of mounts) {
      if (mount.generation > 1) { // Only show mounts that can be bred
        const gen = mount.generation;
        if (!grouped.has(gen)) grouped.set(gen, []);
        grouped.get(gen)!.push(mount);
      }
    }
    return grouped;
  }, [mounts]);

  const sortedRequirements = useMemo(() => {
    return Array.from(calculateRequirements.requirements.values()).sort(
      (a, b) => a.mount.generation - b.mount.generation || a.mount.name.localeCompare(b.mount.name)
    );
  }, [calculateRequirements.requirements]);

  const handleTypeChange = (type: string) => {
    setSelectedMountId("");
    router.push(`/breeding?type=${type}`);
  };

  return (
    <div className="space-y-8">
      {/* Type Selector */}
      <Tabs value={currentType} onValueChange={handleTypeChange}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          {Object.entries(TYPE_CONFIG).map(([type, config]) => (
            <TabsTrigger key={type} value={type}>
              {config.emoji} {config.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Mount Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Choisir une monture cible</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedMountId} onValueChange={(v) => setSelectedMountId(v ?? "")}>
            <SelectTrigger className="w-full max-w-md">
              {selectedMount ? (
                <div className="flex items-center gap-2">
                  {selectedMount.imageUrl && (
                    <img
                      src={selectedMount.imageUrl}
                      alt=""
                      className="w-6 h-6 object-contain"
                    />
                  )}
                  {selectedMount.name}
                </div>
              ) : (
                <span className="text-muted-foreground">
                  Sélectionnez une monture à obtenir...
                </span>
              )}
            </SelectTrigger>
            <SelectContent>
              {Array.from(mountsByGeneration.entries())
                .sort(([a], [b]) => a - b)
                .map(([gen, genMounts]) => (
                  <div key={gen}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                      Génération {gen}
                    </div>
                    {genMounts.map((mount) => (
                      <SelectItem key={mount.id} value={mount.id.toString()}>
                        <div className="flex items-center gap-2">
                          {mount.imageUrl && (
                            <img
                              src={mount.imageUrl}
                              alt=""
                              className="w-6 h-6 object-contain"
                            />
                          )}
                          {mount.name}
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedMount && (
        <>
          {/* Target Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedMount.imageUrl && (
                    <img
                      src={selectedMount.imageUrl}
                      alt={selectedMount.name}
                      className="w-20 h-20 object-contain bg-muted rounded-lg p-2"
                    />
                  )}
                  <div>
                    <CardTitle>{selectedMount.name}</CardTitle>
                    <Badge className="mt-2">Génération {selectedMount.generation}</Badge>
                  </div>
                </div>
                <Link href={`/optimizer?type=${currentType}&target=${selectedMount.id}`}>
                  <Button>Optimiser</Button>
                </Link>
              </div>
            </CardHeader>
          </Card>

          {/* Breeding Tree */}
          <Card>
            <CardHeader>
              <CardTitle>Arbre de reproduction</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {calculateRequirements.tree && (
                <BreedingTree node={calculateRequirements.tree as any} muldoMap={mountMap as any} />
              )}
            </CardContent>
          </Card>

          {/* Required Base Mounts */}
          <Card>
            <CardHeader>
              <CardTitle>Montures de base nécessaires</CardTitle>
              <p className="text-sm text-muted-foreground">
                Les montures de génération 1 dont vous avez besoin pour cette reproduction
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedRequirements.map(({ mount, needed, owned }) => {
                  const missing = Math.max(0, needed - owned);
                  const isComplete = missing === 0;

                  return (
                    <div
                      key={mount.id}
                      className={`p-4 rounded-lg border ${
                        isComplete
                          ? "bg-green-500/10 border-green-500"
                          : "bg-amber-500/10 border-amber-500"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {mount.imageUrl && (
                          <img
                            src={mount.imageUrl}
                            alt={mount.name}
                            className="w-12 h-12 object-contain"
                          />
                        )}
                        <div>
                          <p className="font-medium text-sm">{mount.name}</p>
                          <Badge variant="outline" className="text-xs">
                            Gen {mount.generation}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Possédés / Requis</span>
                        <span className={missing > 0 ? "text-red-500 font-medium" : "text-green-500 font-medium"}>
                          {owned} / {needed}
                          {missing > 0 && (
                            <span className="ml-1">(-{missing})</span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {sortedRequirements.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Cette monture est de génération 1, pas de reproduction nécessaire.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
