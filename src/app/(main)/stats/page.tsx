import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MountType } from "@/generated/prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TYPE_CONFIG = [
  { type: MountType.MULDO, label: "Muldos", emoji: "🐏", slug: "muldos" },
  { type: MountType.DRAGODINDE, label: "Dragodindes", emoji: "🐉", slug: "dragodindes" },
  { type: MountType.VOLKORNE, label: "Volkornes", emoji: "🦏", slug: "volkornes" },
];

function targetPerGender(gen: number) {
  return gen === 1 ? 1 : 2;
}

// Calculate Gen 1 cost for a single mount (recursive with cache)
function calcGen1Cost(
  mountId: number,
  mountMap: Map<number, { id: number; generation: number; parent1Id: number | null; parent2Id: number | null }>,
  cache: Map<number, Map<number, number>>,
): Map<number, number> {
  if (cache.has(mountId)) return cache.get(mountId)!;

  const mount = mountMap.get(mountId);
  if (!mount) return new Map();

  const result = new Map<number, number>();

  if (mount.generation === 1) {
    result.set(mountId, 1);
    cache.set(mountId, result);
    return result;
  }

  if (mount.parent1Id && mount.parent2Id) {
    const cost1 = calcGen1Cost(mount.parent1Id, mountMap, cache);
    const cost2 = calcGen1Cost(mount.parent2Id, mountMap, cache);
    for (const [id, count] of cost1) {
      result.set(id, (result.get(id) || 0) + count);
    }
    for (const [id, count] of cost2) {
      result.set(id, (result.get(id) || 0) + count);
    }
  }

  cache.set(mountId, result);
  return result;
}

export default async function StatsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Fetch all mounts and user mounts in parallel
  const [allMounts, userMounts] = await Promise.all([
    prisma.mount.findMany({ orderBy: [{ type: "asc" }, { generation: "asc" }, { name: "asc" }] }),
    prisma.userMount.findMany({
      where: { userId: session.user.id },
      select: { mountId: true, maleCount: true, femaleCount: true },
    }),
  ]);

  const userMountMap = new Map(userMounts.map((um) => [um.mountId, um]));

  // Build stats per type, per generation
  const typeStats = TYPE_CONFIG.map((cfg) => {
    const mounts = allMounts.filter((m) => m.type === cfg.type);
    const mountMap = new Map(mounts.map((m) => [m.id, m]));
    const generations = [...new Set(mounts.map((m) => m.generation))].sort((a, b) => a - b);
    const gen1CostCache = new Map<number, Map<number, number>>();

    // Calculate Gen 1 needs — smart: only count "leaf" mounts
    // (mounts not used as parents for other missing mounts)
    // because breeding a higher-gen mount produces intermediates as byproducts
    const gen1Needs = new Map<number, number>();
    const gen1Mounts = mounts.filter((m) => m.generation === 1);

    // First pass: identify which mounts are missing (not at target)
    const missingMountIds = new Set<number>();
    for (const mount of mounts) {
      if (mount.generation === 1) continue;
      const um = userMountMap.get(mount.id);
      const males = um?.maleCount ?? 0;
      const females = um?.femaleCount ?? 0;
      const target = targetPerGender(mount.generation);
      if (males < target || females < target) {
        missingMountIds.add(mount.id);
      }
    }

    // Find "leaf" missing mounts: missing mounts that are NOT a parent of another missing mount
    // These are the ones we need to actively breed — intermediates come free
    const isParentOfMissing = new Set<number>();
    for (const id of missingMountIds) {
      const m = mountMap.get(id)!;
      if (m.parent1Id && missingMountIds.has(m.parent1Id)) isParentOfMissing.add(m.parent1Id);
      if (m.parent2Id && missingMountIds.has(m.parent2Id)) isParentOfMissing.add(m.parent2Id);
    }

    const leafMissingIds = new Set(
      [...missingMountIds].filter((id) => !isParentOfMissing.has(id))
    );

    const genStats = generations.map((gen) => {
      const genMounts = mounts.filter((m) => m.generation === gen);
      const target = targetPerGender(gen);

      let totalNeededMales = 0;
      let totalNeededFemales = 0;
      let totalOwnedMales = 0;
      let totalOwnedFemales = 0;
      let atTarget = 0;
      let hasOne = 0;
      let missing = 0;

      for (const mount of genMounts) {
        const um = userMountMap.get(mount.id);
        const males = um?.maleCount ?? 0;
        const females = um?.femaleCount ?? 0;

        totalNeededMales += target;
        totalNeededFemales += target;
        totalOwnedMales += males;
        totalOwnedFemales += females;

        if (males >= target && females >= target) {
          atTarget++;
        } else if (males > 0 || females > 0) {
          hasOne++;
        } else {
          missing++;
        }

        // Calculate Gen 1 cost only for "leaf" missing mounts (1 copy each)
        if (gen > 1 && leafMissingIds.has(mount.id)) {
          const gen1Cost = calcGen1Cost(mount.id, mountMap, gen1CostCache);
          for (const [gen1Id, costPerCopy] of gen1Cost) {
            gen1Needs.set(gen1Id, (gen1Needs.get(gen1Id) || 0) + costPerCopy);
          }
        }
      }

      const remainingMales = Math.max(0, totalNeededMales - totalOwnedMales);
      const remainingFemales = Math.max(0, totalNeededFemales - totalOwnedFemales);

      return {
        gen,
        total: genMounts.length,
        target,
        atTarget,
        hasOne,
        missing,
        totalNeededMales,
        totalNeededFemales,
        totalOwnedMales,
        totalOwnedFemales,
        remainingMales,
        remainingFemales,
        remainingTotal: remainingMales + remainingFemales,
        percentage: genMounts.length > 0 ? Math.round((atTarget / genMounts.length) * 100) : 0,
      };
    });

    // Add Gen 1 own needs (target for Gen 1 = 1M+1F)
    for (const g1 of gen1Mounts) {
      const um = userMountMap.get(g1.id);
      const males = um?.maleCount ?? 0;
      const females = um?.femaleCount ?? 0;
      const missingForSelf = Math.max(0, 1 - males) + Math.max(0, 1 - females);
      if (missingForSelf > 0) {
        gen1Needs.set(g1.id, (gen1Needs.get(g1.id) || 0) + missingForSelf);
      }
    }

    // Build Gen 1 requirements list
    const gen1Requirements = Array.from(gen1Needs.entries())
      .map(([id, needed]) => {
        const mount = mountMap.get(id)!;
        const um = userMountMap.get(id);
        const owned = (um?.maleCount ?? 0) + (um?.femaleCount ?? 0);
        return { mount, needed, owned, remaining: Math.max(0, needed - owned) };
      })
      .sort((a, b) => b.remaining - a.remaining);

    const totalGen1Needed = gen1Requirements.reduce((s, r) => s + r.needed, 0);
    const totalGen1Owned = gen1Requirements.reduce((s, r) => s + Math.min(r.owned, r.needed), 0);
    const totalGen1Remaining = gen1Requirements.reduce((s, r) => s + r.remaining, 0);

    const totals = {
      total: genStats.reduce((s, g) => s + g.total, 0),
      atTarget: genStats.reduce((s, g) => s + g.atTarget, 0),
      hasOne: genStats.reduce((s, g) => s + g.hasOne, 0),
      missing: genStats.reduce((s, g) => s + g.missing, 0),
      remainingMales: genStats.reduce((s, g) => s + g.remainingMales, 0),
      remainingFemales: genStats.reduce((s, g) => s + g.remainingFemales, 0),
      remainingTotal: genStats.reduce((s, g) => s + g.remainingTotal, 0),
      ownedTotal: genStats.reduce((s, g) => s + g.totalOwnedMales + g.totalOwnedFemales, 0),
      neededTotal: genStats.reduce((s, g) => s + g.totalNeededMales + g.totalNeededFemales, 0),
    };

    return { ...cfg, genStats, totals, gen1Requirements, totalGen1Needed, totalGen1Owned, totalGen1Remaining };
  });

  const grandTotals = {
    total: typeStats.reduce((s, t) => s + t.totals.total, 0),
    atTarget: typeStats.reduce((s, t) => s + t.totals.atTarget, 0),
    remainingTotal: typeStats.reduce((s, t) => s + t.totals.remainingTotal, 0),
    ownedTotal: typeStats.reduce((s, t) => s + t.totals.ownedTotal, 0),
    neededTotal: typeStats.reduce((s, t) => s + t.totals.neededTotal, 0),
    totalGen1Remaining: typeStats.reduce((s, t) => s + t.totalGen1Remaining, 0),
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Statistiques d'Elevage</h1>
        <p className="text-muted-foreground">
          Progression globale vers l'objectif : {targetPerGender(1)}♂{targetPerGender(1)}♀ par Gen 1, {targetPerGender(2)}♂{targetPerGender(2)}♀ par Gen 2+
        </p>
      </div>

      {/* Global overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{grandTotals.atTarget}/{grandTotals.total}</div>
            <div className="text-sm text-muted-foreground">Races a l'objectif</div>
            <ProgressBar value={grandTotals.atTarget} max={grandTotals.total} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-500">{grandTotals.ownedTotal}</div>
            <div className="text-sm text-muted-foreground">Montures possedees</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-amber-500">{grandTotals.remainingTotal}</div>
            <div className="text-sm text-muted-foreground">Montures manquantes</div>
          </CardContent>
        </Card>
        <Card className="border-purple-500/30">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-500">{grandTotals.totalGen1Remaining}</div>
            <div className="text-sm text-muted-foreground">Captures Gen 1 requises</div>
            <div className="text-xs text-muted-foreground">pour tout completer</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-primary">
              {grandTotals.total > 0 ? Math.round((grandTotals.atTarget / grandTotals.total) * 100) : 0}%
            </div>
            <div className="text-sm text-muted-foreground">Completion globale</div>
          </CardContent>
        </Card>
      </div>

      {/* Per type breakdown */}
      {typeStats.map((type) => (
        <div key={type.type} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{type.emoji} {type.label}</span>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-sm font-normal">
                    {type.totals.atTarget}/{type.totals.total} races
                  </Badge>
                  <span className="text-sm font-normal text-muted-foreground">
                    {type.totals.total > 0 ? Math.round((type.totals.atTarget / type.totals.total) * 100) : 0}%
                  </span>
                </div>
              </CardTitle>
              <ProgressBar value={type.totals.atTarget} max={type.totals.total} />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 pr-4">Generation</th>
                      <th className="text-center py-2 px-2">Races</th>
                      <th className="text-center py-2 px-2">Objectif</th>
                      <th className="text-center py-2 px-2">Atteint</th>
                      <th className="text-center py-2 px-2">En cours</th>
                      <th className="text-center py-2 px-2">Manquant</th>
                      <th className="text-center py-2 px-2">♂ restants</th>
                      <th className="text-center py-2 px-2">♀ restants</th>
                      <th className="text-center py-2 px-2">Total restant</th>
                      <th className="text-right py-2 pl-4">Progression</th>
                    </tr>
                  </thead>
                  <tbody>
                    {type.genStats.map((g) => (
                      <tr key={g.gen} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 pr-4 font-medium">Gen {g.gen}</td>
                        <td className="text-center py-3 px-2">{g.total}</td>
                        <td className="text-center py-3 px-2 text-muted-foreground">{g.target}♂ {g.target}♀</td>
                        <td className="text-center py-3 px-2">
                          <span className="text-green-500 font-bold">{g.atTarget}</span>
                        </td>
                        <td className="text-center py-3 px-2">
                          {g.hasOne > 0 ? (
                            <span className="text-amber-500 font-bold">{g.hasOne}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="text-center py-3 px-2">
                          {g.missing > 0 ? (
                            <span className="text-red-500 font-bold">{g.missing}</span>
                          ) : (
                            <span className="text-green-500">0</span>
                          )}
                        </td>
                        <td className="text-center py-3 px-2">
                          {g.remainingMales > 0 ? (
                            <span className="text-blue-500 font-medium">{g.remainingMales}♂</span>
                          ) : (
                            <span className="text-green-500">0</span>
                          )}
                        </td>
                        <td className="text-center py-3 px-2">
                          {g.remainingFemales > 0 ? (
                            <span className="text-pink-500 font-medium">{g.remainingFemales}♀</span>
                          ) : (
                            <span className="text-green-500">0</span>
                          )}
                        </td>
                        <td className="text-center py-3 px-2">
                          {g.remainingTotal > 0 ? (
                            <span className="text-amber-500 font-bold">{g.remainingTotal}</span>
                          ) : (
                            <span className="text-green-500 font-bold">0</span>
                          )}
                        </td>
                        <td className="text-right py-3 pl-4">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20">
                              <ProgressBar value={g.atTarget} max={g.total} />
                            </div>
                            <span className={`text-xs font-mono w-10 text-right ${g.percentage === 100 ? "text-green-500" : ""}`}>
                              {g.percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-bold">
                      <td className="py-3 pr-4">Total</td>
                      <td className="text-center py-3 px-2">{type.totals.total}</td>
                      <td className="text-center py-3 px-2"></td>
                      <td className="text-center py-3 px-2 text-green-500">{type.totals.atTarget}</td>
                      <td className="text-center py-3 px-2 text-amber-500">{type.totals.hasOne}</td>
                      <td className="text-center py-3 px-2 text-red-500">{type.totals.missing}</td>
                      <td className="text-center py-3 px-2 text-blue-500">{type.totals.remainingMales}♂</td>
                      <td className="text-center py-3 px-2 text-pink-500">{type.totals.remainingFemales}♀</td>
                      <td className="text-center py-3 px-2 text-amber-500">{type.totals.remainingTotal}</td>
                      <td className="text-right py-3 pl-4">
                        <span className="font-mono text-sm">
                          {type.totals.total > 0 ? Math.round((type.totals.atTarget / type.totals.total) * 100) : 0}%
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Gen 1 Requirements for this type */}
          {type.totalGen1Remaining > 0 && (
            <Card className="border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{type.emoji} Gen 1 necessaires pour {type.label}</span>
                  <Badge variant="outline" className="text-purple-500 border-purple-500/30">
                    {type.totalGen1Remaining} captures restantes
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Nombre de Gen 1 a capturer pour completer toutes les races {type.label} manquantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {type.gen1Requirements.map((req) => (
                    <div
                      key={req.mount.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-sm ${
                        req.remaining === 0
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-purple-500/5 border-purple-500/20"
                      }`}
                    >
                      {req.mount.imageUrl && (
                        <img src={req.mount.imageUrl} alt="" className="w-8 h-8 object-contain shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate text-xs">{req.mount.name}</div>
                        <div className="text-xs">
                          {req.remaining > 0 ? (
                            <>
                              <span className="text-purple-500 font-bold">{req.remaining}</span>
                              <span className="text-muted-foreground"> a capturer</span>
                            </>
                          ) : (
                            <span className="text-green-500">OK ({req.owned} en stock)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
      <div
        className={`h-full rounded-full transition-all ${
          pct === 100 ? "bg-green-500" : pct > 50 ? "bg-blue-500" : pct > 0 ? "bg-amber-500" : "bg-muted"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
