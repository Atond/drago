"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type Fuel,
  type FuelPrices,
  ALL_FUELS,
  GAUGES,
  TIERS,
  SIZES,
  GAUGE_INFO,
  TIER_INFO,
  SIZE_DURABILITY,
  loadFuelPrices,
  saveFuelPrices,
} from "@/lib/fuelData";

function formatKamas(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString("fr-FR");
}

export function CarburantsPage() {
  const [filterGauge, setFilterGauge] = useState<string>("all");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [filterSize, setFilterSize] = useState<string>("all");
  const [prices, setPrices] = useState<FuelPrices>({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPrices(loadFuelPrices());
  }, []);

  const filtered = useMemo(() => {
    return ALL_FUELS.filter((f) => {
      if (filterGauge !== "all" && f.gauge !== filterGauge) return false;
      if (filterTier !== "all" && f.tier !== filterTier) return false;
      if (filterSize !== "all" && f.size !== filterSize) return false;
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [filterGauge, filterTier, filterSize, search]);

  function updatePrice(fuelId: number, value: string) {
    const num = parseInt(value) || 0;
    const next = { ...prices, [fuelId]: num };
    if (num === 0) delete next[fuelId];
    setPrices(next);
    saveFuelPrices(next);
  }

  // Group by gauge for display
  const grouped = useMemo(() => {
    const groups: Record<string, Fuel[]> = {};
    for (const f of filtered) {
      if (!groups[f.gauge]) groups[f.gauge] = [];
      groups[f.gauge].push(f);
    }
    return groups;
  }, [filtered]);

  // Best price per durability for each gauge (cost-efficiency)
  const bestPerGauge = useMemo(() => {
    const best: Record<string, { fuel: Fuel; pricePerDur: number } | null> = {};
    for (const gauge of GAUGES) {
      let bestItem: { fuel: Fuel; pricePerDur: number } | null = null;
      for (const f of ALL_FUELS.filter((f) => f.gauge === gauge)) {
        const price = prices[f.id];
        if (!price || price <= 0) continue;
        const ppd = price / f.durability;
        if (!bestItem || ppd < bestItem.pricePerDur) {
          bestItem = { fuel: f, pricePerDur: ppd };
        }
      }
      best[gauge] = bestItem;
    }
    return best;
  }, [prices]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-1.5 block text-sm">Recherche</Label>
              <Input
                placeholder="Nom du carburant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Jauge</Label>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={filterGauge}
                onChange={(e) => setFilterGauge(e.target.value)}
              >
                <option value="all">Toutes les jauges</option>
                {GAUGES.map((g) => (
                  <option key={g} value={g}>
                    {GAUGE_INFO[g].emoji} {g} ({GAUGE_INFO[g].stat})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Tier</Label>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
              >
                <option value="all">Tous les tiers</option>
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t} (max {(TIER_INFO[t].maxGauge / 1000).toFixed(0)}K)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Taille</Label>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={filterSize}
                onChange={(e) => setFilterSize(e.target.value)}
              >
                <option value="all">Toutes les tailles</option>
                {SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s} ({SIZE_DURABILITY[s].toLocaleString()} dur.)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best cost-efficiency summary */}
      {Object.values(bestPerGauge).some((v) => v !== null) && (
        <Card className="border-green-500/30">
          <CardHeader>
            <CardTitle className="text-lg">Meilleur rapport qualité/prix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {GAUGES.map((gauge) => {
                const best = bestPerGauge[gauge];
                const info = GAUGE_INFO[gauge];
                return (
                  <div
                    key={gauge}
                    className={`p-3 rounded-lg border ${best ? "bg-green-500/5 border-green-500/20" : "bg-muted/50 border-muted"}`}
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      {info.emoji} {gauge}
                    </div>
                    {best ? (
                      <>
                        <div className="font-medium text-sm truncate">{best.fuel.name}</div>
                        <div className="text-xs text-green-500 font-bold">
                          {best.pricePerDur.toFixed(2)} K/dur
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-muted-foreground">Aucun prix</div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fuel cards grouped by gauge */}
      {GAUGES.filter((g) => grouped[g]?.length).map((gauge) => {
        const info = GAUGE_INFO[gauge];
        const fuels = grouped[gauge];
        return (
          <Card key={gauge}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">{info.emoji}</span>
                <span>Carburant de {gauge}</span>
                <Badge variant="outline" className={info.color}>
                  {info.stat}
                </Badge>
                <span className="text-sm font-normal text-muted-foreground ml-auto">
                  {fuels.length} items
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 pr-2 w-10"></th>
                      <th className="text-left py-2 pr-4">Nom</th>
                      <th className="text-center py-2 px-2">Tier</th>
                      <th className="text-center py-2 px-2">Taille</th>
                      <th className="text-center py-2 px-2">Durabilité</th>
                      <th className="text-center py-2 px-2">Jauge max</th>
                      <th className="text-center py-2 px-2">Niveau</th>
                      <th className="text-center py-2 px-2 min-w-[120px]">Prix (kamas)</th>
                      <th className="text-right py-2 pl-2">K/dur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fuels.map((fuel) => {
                      const price = prices[fuel.id] || 0;
                      const pricePerDur = price > 0 ? price / fuel.durability : 0;
                      const isBest = bestPerGauge[gauge]?.fuel.id === fuel.id;
                      return (
                        <tr
                          key={fuel.id}
                          className={`border-b last:border-0 hover:bg-muted/50 ${isBest ? "bg-green-500/5" : ""}`}
                        >
                          <td className="py-2 pr-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={fuel.img}
                              alt=""
                              className="w-8 h-8 object-contain"
                              loading="lazy"
                            />
                          </td>
                          <td className="py-2 pr-4 font-medium">{fuel.name}</td>
                          <td className="text-center py-2 px-2">
                            <Badge variant="outline" className={`text-xs ${TIER_INFO[fuel.tier]?.color || ""}`}>
                              {fuel.tier}
                            </Badge>
                          </td>
                          <td className="text-center py-2 px-2 text-muted-foreground">
                            {fuel.size}
                          </td>
                          <td className="text-center py-2 px-2 font-mono">
                            {fuel.durability.toLocaleString("fr-FR")}
                          </td>
                          <td className="text-center py-2 px-2 font-mono text-muted-foreground">
                            {fuel.maxGauge > 0
                              ? fuel.maxGauge.toLocaleString("fr-FR")
                              : "Illimité"}
                          </td>
                          <td className="text-center py-2 px-2">{fuel.level}</td>
                          <td className="text-center py-2 px-2">
                            <Input
                              type="number"
                              min={0}
                              className="h-7 w-28 text-center text-xs mx-auto"
                              placeholder="0"
                              value={price || ""}
                              onChange={(e) => updatePrice(fuel.id, e.target.value)}
                            />
                          </td>
                          <td className="text-right py-2 pl-2 font-mono text-xs">
                            {pricePerDur > 0 ? (
                              <span className={isBest ? "text-green-500 font-bold" : ""}>
                                {pricePerDur.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun carburant ne correspond aux filtres sélectionnés.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
