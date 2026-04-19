"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  loadFuelPrices,
  getBestPricePerGaugeTier,
  simulateGaugeDrain,
  GAUGE_TIERS,
  type FuelPrices,
} from "@/lib/fuelData";

const XP_LEVEL_100 = 172_668;

const TIERS = [
  { tier: 1, label: "Tier 1 (Extrait)", description: "1 XP/s — jauge max 40K" },
  { tier: 2, label: "Tier 2 (Philtre)", description: "2 XP/s — jauge max 70K" },
  { tier: 3, label: "Tier 3 (Potion)", description: "3 XP/s — jauge max 90K" },
  { tier: 4, label: "Tier 4 (Élixir)", description: "4 XP/s — jauge max 100K" },
];

const PRICES_KEY = "dragodofus-revente";

interface ReventeConfig {
  runeType: "PA" | "PM";
  runePA: number;
  runePM: number;
  filetPrice: number;
  proba: number;
  batchSize: number;
}

const DEFAULT_CONFIG: ReventeConfig = {
  runeType: "PA",
  runePA: 0,
  runePM: 0,
  filetPrice: 0,
  proba: 60,
  batchSize: 10,
};

function loadConfig(): ReventeConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const saved = localStorage.getItem(PRICES_KEY);
    if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_CONFIG;
}

function saveConfig(config: ReventeConfig) {
  localStorage.setItem(PRICES_KEY, JSON.stringify(config));
}

function formatKamas(k: number): string {
  if (Math.abs(k) >= 1_000_000) return `${(k / 1_000_000).toFixed(1)}M kamas`;
  return `${Math.round(k).toLocaleString("fr-FR")} kamas`;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const rh = hours % 24;
    return `${days}j ${rh}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

export function ReventePage() {
  const [config, setConfig] = useState<ReventeConfig>(DEFAULT_CONFIG);
  const [fuelPrices, setFuelPrices] = useState<FuelPrices>({});

  useEffect(() => {
    let cancelled = false;

    setConfig(loadConfig());

    async function loadSharedFuelPrices() {
      const loaded = await loadFuelPrices();
      if (!cancelled) {
        setFuelPrices(loaded);
      }
    }

    void loadSharedFuelPrices();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateConfig(key: keyof ReventeConfig, value: string) {
    const num = parseFloat(value) || 0;
    const next = { ...config, [key]: num };
    setConfig(next);
    saveConfig(next);
  }

  const tieredPrices = useMemo(() => getBestPricePerGaugeTier(fuelPrices), [fuelPrices]);
  const hasFuelPrices = useMemo(() => {
    const mp = tieredPrices["Mangeoire"];
    return mp && Object.values(mp).some((p) => p > 0);
  }, [tieredPrices]);

  // Calculate per-tier results
  const tierResults = useMemo(() => {
    if (!hasFuelPrices) return null;

    return TIERS.map((t) => {
      const mangoirePrices = tieredPrices["Mangeoire"] || {};
      const drain = simulateGaugeDrain(XP_LEVEL_100, t.tier, mangoirePrices);

      const mountsPerEnclosure = 10;

      // Revenue per mount: only the selected rune type
      const runePrice = config.runeType === "PA" ? config.runePA : config.runePM;
      const revenuePerMount = runePrice * (config.proba / 100);

      // Fuel cost is per enclosure fill (10 mounts level simultaneously)
      const fuelCostPerFill = drain.totalCost;
      const fuelCostPerMount = fuelCostPerFill / mountsPerEnclosure;
      const filetCostPerMount = config.filetPrice;
      const totalCostPerMount = fuelCostPerMount + filetCostPerMount;

      // Profit
      const profitPerMount = revenuePerMount - totalCostPerMount;

      // Time = per enclosure fill (all 10 in parallel)
      const timePerFill = drain.timeSeconds;

      // Batch
      const fills = Math.ceil(config.batchSize / mountsPerEnclosure);
      const batchFuelCost = fuelCostPerFill * fills;
      const batchFiletCost = filetCostPerMount * config.batchSize;
      const batchCost = batchFuelCost + batchFiletCost;
      const batchRevenue = revenuePerMount * config.batchSize;
      const batchProfit = batchRevenue - batchCost;
      const batchTime = timePerFill * fills;

      return {
        tier: t.tier,
        label: t.label,
        description: t.description,
        fuelBreakdown: drain.fuelBreakdown,
        totalDurability: drain.totalDurability,
        fuelCostPerFill,
        fuelCostPerMount,
        filetCostPerMount,
        totalCostPerMount,
        revenuePerMount,
        profitPerMount,
        timePerFill,
        fills,
        batchRevenue,
        batchCost,
        batchProfit,
        batchTime,
      };
    });
  }, [tieredPrices, hasFuelPrices, config]);

  const bestTier = useMemo(() => {
    if (!tierResults) return null;
    return tierResults.reduce((best, t) =>
      t.profitPerMount > best.profitPerMount ? t : best
    );
  }, [tierResults]);

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Prix du serveur et probabilités de runes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Label className="mb-1.5 block text-sm">Type de rune</Label>
              <div className="flex gap-1">
                <button
                  className={`flex-1 h-9 rounded-md border text-sm font-medium transition-colors ${
                    config.runeType === "PA"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-accent border-input"
                  }`}
                  onClick={() => {
                    const next = { ...config, runeType: "PA" as const };
                    setConfig(next);
                    saveConfig(next);
                  }}
                >
                  PA
                </button>
                <button
                  className={`flex-1 h-9 rounded-md border text-sm font-medium transition-colors ${
                    config.runeType === "PM"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-accent border-input"
                  }`}
                  onClick={() => {
                    const next = { ...config, runeType: "PM" as const };
                    setConfig(next);
                    saveConfig(next);
                  }}
                >
                  PM
                </button>
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Prix Rune {config.runeType} (kamas)</Label>
              <Input
                type="number"
                min={0}
                value={(config.runeType === "PA" ? config.runePA : config.runePM) || ""}
                onChange={(e) => updateConfig(config.runeType === "PA" ? "runePA" : "runePM", e.target.value)}
                placeholder="Prix vente"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Filet de capture</Label>
              <Input
                type="number"
                min={0}
                value={config.filetPrice || ""}
                onChange={(e) => updateConfig("filetPrice", e.target.value)}
                placeholder="Prix filet"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Probabilité (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={config.proba || ""}
                onChange={(e) => updateConfig("proba", e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Batch (montures)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={config.batchSize || ""}
                onChange={(e) => updateConfig("batchSize", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!hasFuelPrices && (
        <Card className="border-amber-500/30">
          <CardContent className="py-6 text-center text-amber-500">
            Renseignez les prix des carburants de Mangeoire sur la page Carburants pour voir les calculs.
          </CardContent>
        </Card>
      )}

      {/* Tier comparison */}
      {tierResults && (config.runeType === "PA" ? config.runePA > 0 : config.runePM > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {tierResults.map((t) => {
            const isBest = bestTier?.tier === t.tier && t.profitPerMount > 0;
            const profitable = t.profitPerMount > 0;
            return (
              <Card
                key={t.tier}
                className={`${isBest ? "border-green-500 ring-2 ring-green-500/20" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{t.label}</CardTitle>
                    <div className="flex gap-1">
                      {isBest && <Badge className="bg-green-500">Optimal</Badge>}
                      {profitable ? (
                        <Badge variant="outline" className="text-green-500 border-green-500/30">Rentable</Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-500 border-red-500/30">Déficitaire</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Time */}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Temps / 10 montures</span>
                    <span className="font-mono">{formatTime(t.timePerFill)}</span>
                  </div>

                  {/* Fuel breakdown */}
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-medium">Carburant Mangeoire (pour 10 montures)</div>
                    {(["Extrait", "Philtre", "Potion", "Élixir"] as const).map((tier) => {
                      const dur = t.fuelBreakdown[tier] || 0;
                      if (dur === 0) return null;
                      return (
                        <div key={tier} className="flex justify-between text-xs pl-2">
                          <span className="text-muted-foreground">{tier}</span>
                          <span className="font-mono">{dur.toLocaleString("fr-FR")} dur.</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t pt-2 space-y-1">
                    {/* Costs per mount */}
                    <div className="text-xs text-muted-foreground font-medium mb-1">Coûts par monture</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Carburant XP (÷10)</span>
                      <span className="font-mono text-amber-500">{formatKamas(Math.round(t.fuelCostPerMount))}</span>
                    </div>
                    {config.filetPrice > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Filet</span>
                        <span className="font-mono text-amber-500">{formatKamas(t.filetCostPerMount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold">
                      <span>Coût / monture</span>
                      <span className="font-mono text-amber-500">{formatKamas(Math.round(t.totalCostPerMount))}</span>
                    </div>
                  </div>

                  <div className="border-t pt-2 space-y-1">
                    {/* Revenue */}
                    <div className="flex justify-between text-sm font-bold">
                      <span>Revenu moyen (Rune {config.runeType} × {config.proba}%)</span>
                      <span className="font-mono">{formatKamas(Math.round(t.revenuePerMount))}</span>
                    </div>
                  </div>

                  {/* Profit highlight */}
                  <div className={`p-3 rounded-lg border ${
                    profitable
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-red-500/10 border-red-500/30"
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm">Profit / monture</span>
                      <span className={`text-lg font-bold ${profitable ? "text-green-500" : "text-red-500"}`}>
                        {t.profitPerMount >= 0 ? "+" : ""}{formatKamas(Math.round(t.profitPerMount))}
                      </span>
                    </div>
                  </div>

                  {/* Batch */}
                  {config.batchSize > 1 && (
                    <div className="text-xs text-muted-foreground border-t pt-2 space-y-0.5">
                      <div className="font-medium">Batch de {config.batchSize} montures ({t.fills} remplissage{t.fills > 1 ? "s" : ""}) :</div>
                      <div className="flex justify-between">
                        <span>Temps total</span>
                        <span className="font-mono">{formatTime(t.batchTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Coût total</span>
                        <span className="font-mono">{formatKamas(Math.round(t.batchCost))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Revenu moyen</span>
                        <span className="font-mono">{formatKamas(Math.round(t.batchRevenue))}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Profit moyen</span>
                        <span className={t.batchProfit >= 0 ? "text-green-500" : "text-red-500"}>
                          {t.batchProfit >= 0 ? "+" : ""}{formatKamas(Math.round(t.batchProfit))}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info card */}
      <Card className="border-blue-500/20">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">Comment ca marche ?</h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Capturez des montures sauvages Gen 1 (gratuites)</li>
            <li>Montez-les au niveau 100 dans un enclos (via Mangeoire uniquement, pas besoin des autres stats)</li>
            <li>Utilisez un Filet de Capture pour obtenir un certificat</li>
            <li>Brisez le certificat pour tenter d'obtenir des runes PA et/ou PM</li>
            <li>Vendez les runes en HDV</li>
          </ol>
          <p className="text-sm text-muted-foreground mt-3">
            XP necessaire pour le niveau 100 : <span className="font-mono font-bold">{XP_LEVEL_100.toLocaleString("fr-FR")} XP</span>
            <br />
            Les 10 montures d'un enclos montent en parallele — le temps affiche est pour 10 montures simultanees.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
