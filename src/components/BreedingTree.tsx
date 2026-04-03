"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Muldo {
  id: number;
  name: string;
  generation: number;
  imageUrl: string | null;
  parent1Id: number | null;
  parent2Id: number | null;
}

interface TreeNode {
  muldo: Muldo;
  owned: boolean;
  totalOwned: number;
  children: [TreeNode, TreeNode] | null;
}

interface BreedingTreeProps {
  node: TreeNode;
  muldoMap: Map<number, Muldo>;
}

interface LayerMuldo {
  muldo: Muldo;
  needed: number;
  owned: number;
}

export function BreedingTree({ node, muldoMap }: BreedingTreeProps) {
  const [viewMode, setViewMode] = useState<"schema" | "list">("schema");

  // Flatten tree into layers by generation, counting occurrences
  const layers = useMemo(() => {
    const muldoCounts = new Map<number, { needed: number; owned: number }>();

    function countMuldos(n: TreeNode) {
      const existing = muldoCounts.get(n.muldo.id);
      if (existing) {
        existing.needed++;
      } else {
        muldoCounts.set(n.muldo.id, { needed: 1, owned: n.totalOwned });
      }

      if (n.children) {
        countMuldos(n.children[0]);
        countMuldos(n.children[1]);
      }
    }

    countMuldos(node);

    // Group by generation
    const byGeneration = new Map<number, LayerMuldo[]>();

    for (const [muldoId, counts] of muldoCounts) {
      const muldo = muldoMap.get(muldoId)!;
      const gen = muldo.generation;

      if (!byGeneration.has(gen)) {
        byGeneration.set(gen, []);
      }

      byGeneration.get(gen)!.push({
        muldo,
        needed: counts.needed,
        owned: counts.owned,
      });
    }

    // Sort generations descending (target at top) and sort muldos by name
    return Array.from(byGeneration.entries())
      .sort(([a], [b]) => b - a)
      .map(([gen, muldos]) => ({
        generation: gen,
        muldos: muldos.sort((a, b) => a.muldo.name.localeCompare(b.muldo.name)),
      }));
  }, [node, muldoMap]);

  return (
    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "schema" | "list")}>
      <TabsList className="mb-4">
        <TabsTrigger value="schema">Schéma</TabsTrigger>
        <TabsTrigger value="list">Liste</TabsTrigger>
      </TabsList>

      <TabsContent value="schema">
        <SchemaView layers={layers} muldoMap={muldoMap} />
      </TabsContent>

      <TabsContent value="list">
        <ListView node={node} muldoMap={muldoMap} depth={0} />
      </TabsContent>
    </Tabs>
  );
}

// Schema View - Layered visualization
function SchemaView({ layers, muldoMap }: { layers: { generation: number; muldos: LayerMuldo[] }[]; muldoMap: Map<number, Muldo> }) {
  return (
    <div className="space-y-2">
      {layers.map(({ generation, muldos }, layerIndex) => (
        <div key={generation} className="relative">
          {/* Generation label */}
          <div className="flex items-center gap-4 mb-2">
            <div className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">
              Gen {generation}
            </div>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Muldos in this generation */}
          <div className="flex flex-wrap gap-2 pl-4">
            {muldos.map(({ muldo, needed, owned }) => {
              const hasEnough = owned >= needed;
              const parent1 = muldo.parent1Id ? muldoMap.get(muldo.parent1Id) : null;
              const parent2 = muldo.parent2Id ? muldoMap.get(muldo.parent2Id) : null;

              return (
                <div
                  key={muldo.id}
                  className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all hover:scale-105 ${
                    hasEnough
                      ? "bg-green-500/10 border-green-500/50"
                      : "bg-card border-border hover:border-primary/50"
                  }`}
                >
                  {/* Quantity badge */}
                  {needed > 1 && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {needed}
                    </div>
                  )}

                  {muldo.imageUrl && (
                    <img
                      src={muldo.imageUrl}
                      alt={muldo.name}
                      className="w-8 h-8 object-contain"
                    />
                  )}

                  <div className="text-left min-w-0">
                    <p className="text-xs font-medium leading-tight truncate max-w-[120px]">
                      {muldo.name.replace("Muldo ", "")}
                    </p>
                    <div className="flex items-center gap-1 text-[10px]">
                      {hasEnough ? (
                        <span className="text-green-500">✓ {owned}</span>
                      ) : (
                        <span className="text-amber-500">{owned}/{needed}</span>
                      )}
                    </div>
                  </div>

                  {/* Tooltip showing parents on hover */}
                  {parent1 && parent2 && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-20 pointer-events-none">
                      <div className="bg-popover text-popover-foreground text-sm p-3 rounded-lg shadow-lg border min-w-[200px]">
                        <div className="font-semibold mb-2 text-center">Parents</div>
                        <div className="flex items-center gap-2 justify-center">
                          <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                            {parent1.imageUrl && (
                              <img src={parent1.imageUrl} alt="" className="w-6 h-6" />
                            )}
                            <span className="text-xs">{parent1.name.replace("Muldo ", "")}</span>
                          </div>
                          <span className="text-muted-foreground font-bold">+</span>
                          <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                            {parent2.imageUrl && (
                              <img src={parent2.imageUrl} alt="" className="w-6 h-6" />
                            )}
                            <span className="text-xs">{parent2.name.replace("Muldo ", "")}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Arrow to next layer (pointing UP - ingredients flow to target) */}
          {layerIndex < layers.length - 1 && (
            <div className="flex justify-center py-1">
              <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// List View - Hierarchical tree like Satisfactory
function ListView({ node, muldoMap, depth }: { node: TreeNode; muldoMap: Map<number, Muldo>; depth: number }) {
  const { muldo, owned, totalOwned, children } = node;
  const hasEnough = totalOwned > 0;
  const parent1 = muldo.parent1Id ? muldoMap.get(muldo.parent1Id) : null;
  const parent2 = muldo.parent2Id ? muldoMap.get(muldo.parent2Id) : null;

  return (
    <div className={depth > 0 ? "ml-6 border-l-2 border-border pl-4" : ""}>
      {/* Current item */}
      <div className={`flex items-center gap-3 py-2 px-3 rounded-lg my-1 ${
        hasEnough ? "bg-green-500/10" : "bg-muted/50"
      }`}>
        {/* Output indicator */}
        <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10 text-primary font-bold text-sm">
          1×
        </div>

        {/* Muldo info */}
        {muldo.imageUrl && (
          <img
            src={muldo.imageUrl}
            alt={muldo.name}
            className="w-10 h-10 object-contain"
          />
        )}

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{muldo.name}</span>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              Gen {muldo.generation}
            </span>
          </div>

          {/* Recipe info */}
          {parent1 && parent2 && (
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span>Recette :</span>
              <span className="flex items-center gap-1">
                {parent1.imageUrl && <img src={parent1.imageUrl} alt="" className="w-4 h-4" />}
                {parent1.name.replace("Muldo ", "")}
              </span>
              <span>+</span>
              <span className="flex items-center gap-1">
                {parent2.imageUrl && <img src={parent2.imageUrl} alt="" className="w-4 h-4" />}
                {parent2.name.replace("Muldo ", "")}
              </span>
            </div>
          )}
        </div>

        {/* Ownership status */}
        <div className={`text-sm font-medium px-2 py-1 rounded ${
          hasEnough ? "bg-green-500/20 text-green-600" : "bg-amber-500/20 text-amber-600"
        }`}>
          {hasEnough ? `✓ ${totalOwned} possédé${totalOwned > 1 ? 's' : ''}` : "Manquant"}
        </div>
      </div>

      {/* Children (ingredients) */}
      {children && (
        <div className="space-y-0">
          <div className="ml-4 text-xs text-muted-foreground py-1 flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            Ingrédients nécessaires
          </div>
          <ListView node={children[0]} muldoMap={muldoMap} depth={depth + 1} />
          <ListView node={children[1]} muldoMap={muldoMap} depth={depth + 1} />
        </div>
      )}
    </div>
  );
}
