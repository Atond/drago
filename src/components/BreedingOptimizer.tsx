"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { saveBreedingPlan, deleteBreedingPlan } from "@/lib/actions";
import { loadFuelPrices, getBestPricePerGauge, getBestPricePerGaugeTier, simulateGaugeDrain, GAUGE_TIERS, type FuelPrices, type TieredGaugePrices } from "@/lib/fuelData";

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

interface SavedPlan {
  id: number;
  mountId: number;
  parentLevel: number;
  xpTier: number;
  numEnclosures: number;
  gen1Multiplier: number;
  useCloning: boolean;
  useOptimakina: boolean;
  useReproducteur: boolean;
  note: string | null;
  createdAt: Date;
  mount: { id: number; name: string; imageUrl: string | null; type: string };
}

interface BreedingOptimizerProps {
  mounts: Mount[];
  userMounts: UserMount[];
  currentType: "MULDO" | "DRAGODINDE" | "VOLKORNE";
  initialTargetId: number | null;
  savedPlans?: SavedPlan[];
}

interface CascadeStep {
  mount: Mount;
  instances: number;
  pairs: number;
  cloneMultiplier: number;
  attempts: number;
  probability: number;
  expectedBabies: number;
  feedsNext: number;
  ownedPairs: number; // pairs available from user's collection
  bredSupply: number; // supply from breeding (without owned)
}

// Constants
const XP_LEVEL_100 = 172668;
const XP_LEVEL_200 = 867582;
const BASE_PROBABILITY = 30;
const LEVEL_BONUS_PER_LEVEL = 0.15;
const OPTIMAKINA_BONUS = 10;

const TYPE_CONFIG = {
  MULDO: { label: "Muldos", emoji: "🐏" },
  DRAGODINDE: { label: "Dragodindes", emoji: "🐉" },
  VOLKORNE: { label: "Volkornes", emoji: "🦏" },
};

// XP Tier configuration (XP per second)
const XP_TIERS = [
  { tier: 1, xpPerSec: 1, label: "Tier 1", description: "10 XP / 10s" },
  { tier: 2, xpPerSec: 2, label: "Tier 2", description: "20 XP / 10s" },
  { tier: 3, xpPerSec: 3, label: "Tier 3", description: "30 XP / 10s" },
  { tier: 4, xpPerSec: 4, label: "Tier 4", description: "40 XP / 10s" },
];

// Enclosure constants
const STAT_MAX = 20000; // Endurance, Maturity, Love max
const SERENITY_RANGE = 5000; // -5000 to +5000
const MOUNTS_PER_ENCLOSURE = 10;
const MAX_ENCLOSURES = 6;

// Fuel gauge consumption per cycle (one full breeding prep)
// During phases, the gauges drain. We calculate total fuel needed per batch.
// Each active gauge drains at the same rate regardless of mount count.
const FUEL_TYPES = [
  { key: "baffeur", label: "Carburant de Baffeur", stat: "Sérénité -" },
  { key: "caresseur", label: "Carburant de Caresseur", stat: "Sérénité +" },
  { key: "foudroyeur", label: "Carburant de Foudroyeur", stat: "Endurance" },
  { key: "abreuvoir", label: "Carburant d'Abreuvoir", stat: "Maturité" },
  { key: "dragofesse", label: "Carburant de Dragofesse", stat: "Amour" },
  { key: "mangeoire", label: "Carburant de Mangeoire", stat: "XP" },
] as const;

interface ResourcePrices {
  optimakinaPrice: number;
}

const DEFAULT_PRICES: ResourcePrices = {
  optimakinaPrice: 0,
};

function loadPrices(): ResourcePrices {
  if (typeof window === "undefined") return DEFAULT_PRICES;
  try {
    const saved = localStorage.getItem("dragodofus-prices");
    if (saved) return { ...DEFAULT_PRICES, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_PRICES;
}

function savePrices(prices: ResourcePrices) {
  if (typeof window === "undefined") return;
  localStorage.setItem("dragodofus-prices", JSON.stringify(prices));
}

// Calculate fuel consumption with proper tier-based drain simulation
// Each gauge is filled to the selected tier's max, then drains through tiers.
// Higher tiers drain faster (more stat/sec) but use more expensive fuel.
function calculateTieredFuelNeeds(
  phases: EnclosurePhase[],
  remainingXp: number,
  maxTier: number, // 1-4
  batches: number,
  tieredPrices: TieredGaugePrices,
) {
  // Sum up total stat points needed per gauge (across all phases + remaining XP)
  const statPerGauge: Record<string, number> = {
    Baffeur: 0, Caresseur: 0, Foudroyeur: 0, Abreuvoir: 0, Dragofesse: 0, Mangeoire: 0,
  };

  const mapGauge = (name: string): string | null => {
    if (name.includes("Baffeur")) return "Baffeur";
    if (name.includes("Caresseur")) return "Caresseur";
    if (name.includes("Foudroyeur")) return "Foudroyeur";
    if (name.includes("Abreuvoir")) return "Abreuvoir";
    if (name.includes("Dragofesse")) return "Dragofesse";
    if (name.includes("Mangeoire")) return "Mangeoire";
    return null;
  };

  for (const phase of phases) {
    const g1 = mapGauge(phase.gauge1);
    const g2 = mapGauge(phase.gauge2);
    if (g1) statPerGauge[g1] += phase.duration;
    if (g2) statPerGauge[g2] += phase.duration;
  }
  if (remainingXp > 0) {
    statPerGauge.Mangeoire += remainingXp;
  }

  // Simulate drain for each gauge
  const gaugeResults: Record<string, ReturnType<typeof simulateGaugeDrain>> = {};
  let totalTime = 0;
  let totalCost = 0;
  let totalDurability = 0;
  const fuelTierTotals: Record<string, number> = {}; // tier → total durability across all gauges

  for (const [gauge, stat] of Object.entries(statPerGauge)) {
    const gaugePrices = tieredPrices[gauge] || {};
    const result = simulateGaugeDrain(stat * batches, maxTier, gaugePrices);
    gaugeResults[gauge] = result;
    totalTime += result.timeSeconds;
    totalCost += result.totalCost;
    totalDurability += result.totalDurability;
    for (const [tier, dur] of Object.entries(result.fuelBreakdown)) {
      fuelTierTotals[tier] = (fuelTierTotals[tier] || 0) + dur;
    }
  }

  return { gaugeResults, totalTime, totalCost, totalDurability, fuelTierTotals };
}

// Enclosure phases for optimal stat filling
// Strategy: park serenity at sweet spots to maximize parallel stat gains
interface EnclosurePhase {
  name: string;
  gauge1: string;
  gauge2: string;
  duration: number; // in ticks at rate 1/sec, divide by xpPerSec
  statsGained: { endurance: number; maturity: number; love: number; xp: number; serenity: number };
  description: string;
  color: string;
}

function calculateEnclosurePhases(xpPerSec: number, initialSerenity: number): EnclosurePhase[] {
  // Serenity ranges for stat gains:
  // Endurance: -5000 to -1 (negative)
  // Maturité:  -2000 to +2000 (moderate)
  // Amour:     0 to +5000 (positive)
  //
  // Sweet spots:
  // Serenity = -1 → Endurance + Maturité both grow (overlap zone -2000 to -1)
  // Serenity = +1 → Maturité + Amour both grow (overlap zone 0 to +2000)
  //
  // Optimal strategy:
  // 1. Adjust serenity to -1 (Baffeur or Caresseur depending on initial value)
  // 2. Foudroyeur + Abreuvoir → fill Endurance + Maturité simultaneously
  // 3. Caresseur briefly to +1 (just 2 ticks)
  // 4. Dragofesse + Mangeoire → fill Amour + gain XP

  const phases: EnclosurePhase[] = [];

  // Phase 1: Adjust serenity to -1
  if (initialSerenity > -1) {
    // Need to lower serenity (use Baffeur)
    const drop = initialSerenity + 1; // e.g. from +4800 → -1 = 4801 ticks
    if (drop > 0) {
      phases.push({
        name: "Baisser sérénité → -1",
        gauge1: "Baffeur (-sérénité)",
        gauge2: "Mangeoire (XP)",
        duration: drop,
        statsGained: { endurance: 0, maturity: 0, love: 0, xp: drop, serenity: -drop },
        description: `Sérénité de ${initialSerenity > 0 ? "+" : ""}${initialSerenity} → -1 pour débloquer Endurance + Maturité`,
        color: "bg-purple-500/20 border-purple-500",
      });
    }
  } else if (initialSerenity < -1) {
    // Need to raise serenity (use Caresseur)
    const raise = Math.abs(initialSerenity) - 1; // e.g. from -3600 → -1 = 3599 ticks
    if (raise > 0) {
      phases.push({
        name: "Remonter sérénité → -1",
        gauge1: "Caresseur (+sérénité)",
        gauge2: "Mangeoire (XP)",
        duration: raise,
        statsGained: { endurance: 0, maturity: 0, love: 0, xp: raise, serenity: raise },
        description: `Sérénité de ${initialSerenity} → -1 pour débloquer Endurance + Maturité`,
        color: "bg-purple-500/20 border-purple-500",
      });
    }
  }
  // If initialSerenity === -1, skip — already perfect

  // Phase 2: Endurance + Maturité (serenity at -1)
  phases.push({
    name: "Endurance + Maturité",
    gauge1: "Foudroyeur (Endurance)",
    gauge2: "Abreuvoir (Maturité)",
    duration: STAT_MAX,
    statsGained: { endurance: STAT_MAX, maturity: STAT_MAX, love: 0, xp: 0, serenity: 0 },
    description: "Sérénité à -1 → zone [-2000, -1] : Endurance et Maturité montent simultanément",
    color: "bg-blue-500/20 border-blue-500",
  });

  // Phase 3: Flip serenity from -1 to +1 (2 ticks of Caresseur)
  phases.push({
    name: "Basculer sérénité → +1",
    gauge1: "Caresseur (+sérénité)",
    gauge2: "Mangeoire (XP)",
    duration: 2, // from -1 to +1
    statsGained: { endurance: 0, maturity: 0, love: 0, xp: 2, serenity: 2 },
    description: "Bascule rapide de -1 à +1 pour débloquer l'Amour",
    color: "bg-purple-500/20 border-purple-500",
  });

  // Phase 4: Amour + XP (serenity at +1)
  phases.push({
    name: "Amour + XP",
    gauge1: "Dragofesse (Amour)",
    gauge2: "Mangeoire (XP)",
    duration: STAT_MAX,
    statsGained: { endurance: 0, maturity: 0, love: STAT_MAX, xp: STAT_MAX, serenity: 0 },
    description: "Sérénité à +1 → zone [0, +5000] : l'Amour monte. Mangeoire en parallèle pour l'XP",
    color: "bg-red-500/20 border-red-500",
  });

  return phases;
}

function calculateEnclosureTimeline(
  maxTier: number, // 1-4, determines how high gauges are filled
  targetLevel: number,
  numEnclosures: number,
  totalMountsNeeded: number,
  initialSerenity: number,
) {
  // Phases still produce stat points in "ticks" (1 tick = 1 stat point consumed from gauge)
  const phases = calculateEnclosurePhases(1, initialSerenity); // xpPerSec=1 just for phase structure

  // Calculate time per batch using tier drain simulation
  // For each phase, the active gauges drain from maxTier down
  // Two gauges run simultaneously — time = max drain time of the two (they run in parallel)
  const activeTiers = GAUGE_TIERS.slice(0, maxTier);
  const totalCapacity = activeTiers.reduce((s, t) => s + t.capacity, 0);

  // Calculate time for a given stat amount to be produced by a gauge filled to maxTier
  function timeForStat(statNeeded: number): number {
    let remaining = statNeeded;
    let time = 0;
    const fills = Math.ceil(remaining / totalCapacity);
    for (let fill = 0; fill < fills && remaining > 0; fill++) {
      for (let i = activeTiers.length - 1; i >= 0 && remaining > 0; i--) {
        const tier = activeTiers[i];
        const statFromTier = Math.min(tier.capacity, remaining);
        time += statFromTier / tier.ratePerSec;
        remaining -= statFromTier;
      }
    }
    return time;
  }

  // Time for stat phases
  let totalStatTime = 0;
  let xpGainedDuringStats = 0;
  for (const phase of phases) {
    // Each gauge in the phase runs simultaneously — time = duration / effective rate
    // But both gauges drain the same amount of stat points (duration)
    const phaseTime = timeForStat(phase.duration);
    totalStatTime += phaseTime;
    // XP from Mangeoire during this phase: stat points = duration ticks (regardless of speed)
    xpGainedDuringStats += phase.statsGained.xp; // still in raw stat points
  }

  const targetXp = getXpForLevel(targetLevel);
  const remainingXp = Math.max(0, targetXp - xpGainedDuringStats);
  const additionalXpTime = remainingXp > 0 ? timeForStat(remainingXp) : 0;
  const totalTimePerBatch = totalStatTime + additionalXpTime;

  const mountsPerBatch = numEnclosures * MOUNTS_PER_ENCLOSURE;
  const batches = Math.ceil(totalMountsNeeded / mountsPerBatch);
  const totalTime = batches * totalTimePerBatch;

  // Naive strategy comparison (sequential stats, no serenity optimization)
  const naiveStatTime = timeForStat(3 * STAT_MAX);
  const naiveXpTime = timeForStat(targetXp);
  const naiveTotalPerBatch = naiveStatTime + naiveXpTime;
  const naiveTotalTime = batches * naiveTotalPerBatch;

  // Build per-enclosure schedule (which mounts go where, per round)
  let mountsRemaining = totalMountsNeeded;
  const rounds: { roundIndex: number; enclosures: { enclosureIndex: number; mountCount: number; phases: typeof phases; additionalXpTime: number }[] }[] = [];

  for (let r = 0; r < batches; r++) {
    const enclosures: { enclosureIndex: number; mountCount: number; phases: typeof phases; additionalXpTime: number }[] = [];
    for (let e = 0; e < numEnclosures && mountsRemaining > 0; e++) {
      const count = Math.min(MOUNTS_PER_ENCLOSURE, mountsRemaining);
      mountsRemaining -= count;
      enclosures.push({
        enclosureIndex: e,
        mountCount: count,
        phases,
        additionalXpTime,
      });
    }
    rounds.push({ roundIndex: r, enclosures });
  }

  return {
    phases,
    totalStatTime,
    xpGainedDuringStats,
    remainingXp,
    additionalXpTime,
    totalTimePerBatch,
    mountsPerBatch,
    batches,
    totalTime,
    naiveTotalPerBatch,
    naiveTotalTime,
    timeSaved: naiveTotalTime - totalTime,
    rounds,
  };
}


// Dynamic clone multiplier: 1.5 → 2 based on pairs available
function dynClone(pairs: number, useClone: boolean): number {
  if (!useClone) return 1.0;
  return 2 - 1 / (Math.max(pairs, 0.01) + 1);
}

// Calculate probability
function calcProbability(level: number, useOptimakina: boolean): number {
  const levelBonus = level * 2 * LEVEL_BONUS_PER_LEVEL;
  const optimakinaBonus = useOptimakina ? OPTIMAKINA_BONUS : 0;
  return Math.min(100, BASE_PROBABILITY + levelBonus + optimakinaBonus) / 100;
}

// XP for level
function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level <= 100) return Math.round((level / 100) * XP_LEVEL_100);
  return Math.round(XP_LEVEL_100 + ((level - 100) / 100) * (XP_LEVEL_200 - XP_LEVEL_100));
}

// Color based on expected babies
function getBabyColor(v: number): string {
  if (v >= 10) return "text-green-500";
  if (v >= 3) return "text-yellow-500";
  if (v >= 1) return "text-orange-500";
  return "text-red-500";
}

function getBabyBg(v: number): string {
  if (v >= 10) return "bg-green-500/20";
  if (v >= 3) return "bg-yellow-500/20";
  if (v >= 1) return "bg-orange-500/20";
  return "bg-red-500/20";
}

// Calculate expected time per successful baby (in seconds) for a given level
// Formula: (2 * XP(L) / xpPerSec) / p(L) = time to level a pair / success chance
function timePerBaby(level: number, xpPerSec: number, useOptimakina: boolean, useReproducteur: boolean): number {
  const xp = getXpForLevel(level);
  if (xp === 0) return 0;
  const prob = calcProbability(level, useOptimakina);
  const reproMult = useReproducteur ? 2 : 1;
  return (2 * xp / xpPerSec) / (prob * reproMult);
}

// Find the optimal level that minimizes time per successful baby
function findOptimalLevel(xpPerSec: number, useOptimakina: boolean, useReproducteur: boolean): {
  optimalLevel: number;
  comparison: { level: number; prob: number; xp: number; timePerBaby: number }[];
} {
  let bestLevel = 2;
  let bestTime = Infinity;

  for (let l = 2; l <= 200; l++) {
    const t = timePerBaby(l, xpPerSec, useOptimakina, useReproducteur);
    if (t < bestTime) {
      bestTime = t;
      bestLevel = l;
    }
  }

  const keyLevels = [5, 10, 20, 50, 100, 150, 200];
  if (!keyLevels.includes(bestLevel)) {
    keyLevels.push(bestLevel);
    keyLevels.sort((a, b) => a - b);
  }

  const comparison = keyLevels.map(level => ({
    level,
    prob: calcProbability(level, useOptimakina) * 100,
    xp: getXpForLevel(level),
    timePerBaby: timePerBaby(level, xpPerSec, useOptimakina, useReproducteur),
  }));

  return { optimalLevel: bestLevel, comparison };
}

export function BreedingOptimizer({
  mounts,
  userMounts,
  currentType,
  initialTargetId,
  savedPlans = [],
}: BreedingOptimizerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Basic settings
  const [selectedMountId, setSelectedMountId] = useState<string>(initialTargetId?.toString() || "");
  const [parentLevel, setParentLevel] = useState(100);
  const [useOptimakina, setUseOptimakina] = useState(false);
  const [useReproducteur, setUseReproducteur] = useState(false);
  const [useCloning, setUseCloning] = useState(true);
  const [gen1Multiplier, setGen1Multiplier] = useState(1);
  const [xpTier, setXpTier] = useState(1);
  const [numEnclosures, setNumEnclosures] = useState(1);
  const [initialSerenity, setInitialSerenity] = useState(0);

  // Resource prices (localStorage)
  const [prices, setPrices] = useState<ResourcePrices>(DEFAULT_PRICES);
  const [fuelPrices, setFuelPrices] = useState<FuelPrices>({});
  useEffect(() => {
    setPrices(loadPrices());
    setFuelPrices(loadFuelPrices());
  }, []);
  const updatePrice = (key: keyof ResourcePrices, value: number) => {
    const updated = { ...prices, [key]: value };
    setPrices(updated);
    savePrices(updated);
  };

  // Best price per durability for each gauge type (from carburants page)
  const gaugePrices = useMemo(() => getBestPricePerGauge(fuelPrices), [fuelPrices]);
  const tieredGaugePrices = useMemo(() => getBestPricePerGaugeTier(fuelPrices), [fuelPrices]);
  const hasFuelPrices = useMemo(() => Object.values(gaugePrices).some(p => p > 0), [gaugePrices]);

  // Advanced mode
  const [advancedMode, setAdvancedMode] = useState(false);

  const mountMap = useMemo(() => new Map(mounts.map((m) => [m.id, m])), [mounts]);
  const userMountMap = useMemo(() => new Map(userMounts.map((um) => [um.mountId, um])), [userMounts]);
  const selectedMount = selectedMountId ? mountMap.get(parseInt(selectedMountId)) : null;

  // Get Gen 1 mounts
  const gen1Mounts = useMemo(() => mounts.filter(m => m.generation === 1), [mounts]);

  // Calculate Gen 1 requirements recursively
  const calculateGen1Cost = useMemo(() => {
    const cache = new Map<number, Map<number, number>>();

    function gen1Cost(mountId: number): Map<number, number> {
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
        const cost1 = gen1Cost(mount.parent1Id);
        const cost2 = gen1Cost(mount.parent2Id);

        // Merge costs
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

    return gen1Cost;
  }, [mountMap]);

  // Main calculation
  const analysis = useMemo(() => {
    if (!selectedMount) return null;

    const probability = calcProbability(parentLevel, useOptimakina);
    const reproMultiplier = useReproducteur ? 2 : 1;

    // Calculate supply recursively (how many we can produce at each step)
    const supplyCache = new Map<number, number>();

    function supply(mountId: number): number {
      if (supplyCache.has(mountId)) return supplyCache.get(mountId)!;

      const mount = mountMap.get(mountId);
      if (!mount) return 0;

      // Gen 1: we have gen1Multiplier pairs of each unique Gen 1 species
      if (mount.generation === 1) {
        const owned = userMountMap.get(mountId);
        const ownedPairs = owned ? Math.min(owned.maleCount, owned.femaleCount) : 0;
        const result = gen1Multiplier + ownedPairs;
        supplyCache.set(mountId, result);
        return result;
      }

      if (!mount.parent1Id || !mount.parent2Id) return 0;

      const supplyA = supply(mount.parent1Id);
      const supplyB = supply(mount.parent2Id);
      const pairs = Math.min(supplyA, supplyB);
      const cloneMult = dynClone(pairs, useCloning);
      const bredResult = pairs * cloneMult * probability * reproMultiplier;

      // Add owned pairs of this intermediate mount (user already has them)
      const owned = userMountMap.get(mountId);
      const ownedPairs = owned ? Math.min(owned.maleCount, owned.femaleCount) : 0;
      const result = bredResult + ownedPairs;

      supplyCache.set(mountId, result);
      return result;
    }

    // Build cascade steps (bottom-up, from Gen 1 to target)
    const cascadeSteps: CascadeStep[] = [];
    const processed = new Set<number>();

    // Build steps by generation (ascending) - use supply() which already handles the cascade correctly
    function buildSteps(mountId: number): void {
      const mount = mountMap.get(mountId);
      if (!mount || mount.generation === 1 || processed.has(mountId)) return;

      // Process parents first
      if (mount.parent1Id) buildSteps(mount.parent1Id);
      if (mount.parent2Id) buildSteps(mount.parent2Id);

      if (processed.has(mountId)) return;
      processed.add(mountId);

      const supplyA = mount.parent1Id ? supply(mount.parent1Id) : 0;
      const supplyB = mount.parent2Id ? supply(mount.parent2Id) : 0;
      const pairs = Math.min(supplyA, supplyB);
      const cloneMult = dynClone(pairs, useCloning);
      const attempts = pairs * cloneMult;
      const expectedBabies = attempts * probability * reproMultiplier;

      // Owned pairs for this mount
      const owned = userMountMap.get(mountId);
      const ownedPairs = owned ? Math.min(owned.maleCount, owned.femaleCount) : 0;

      cascadeSteps.push({
        mount,
        instances: 1,
        pairs,
        cloneMultiplier: cloneMult,
        attempts,
        probability: probability * 100,
        expectedBabies,
        feedsNext: expectedBabies + ownedPairs,
        ownedPairs,
        bredSupply: expectedBabies,
      });
    }

    buildSteps(selectedMount.id);

    // Sort by generation
    cascadeSteps.sort((a, b) => a.mount.generation - b.mount.generation);

    // Calculate Gen 1 needs
    const gen1Costs = calculateGen1Cost(selectedMount.id);
    const gen1Requirements = Array.from(gen1Costs.entries()).map(([id, baseCost]) => {
      const mount = mountMap.get(id)!;
      // Each unique Gen 1 species needs baseCost captures (1 mount per species)
      // They pair cross-species (e.g., 1 Indigo + 1 Ebène), not same-species pairs
      // gen1Multiplier scales the stock (more backup for sterility)
      const needed = baseCost * gen1Multiplier;
      const owned = (userMountMap.get(id)?.maleCount || 0) + (userMountMap.get(id)?.femaleCount || 0);
      return { mount, needed, owned };
    });

    // Totals
    const totalGen1Needed = gen1Requirements.reduce((sum, r) => sum + r.needed, 0);
    // Each breeding step uses pairs of parents that need leveling
    // Intermediate babies (Gen 2, 3...) from cascade steps also need leveling for next breeding
    const intermediateMountsToLevel = cascadeSteps
      .filter((_, i) => i < cascadeSteps.length - 1)
      .reduce((sum, s) => sum + Math.ceil(s.expectedBabies) * 2, 0);
    const totalMountsToLevel = totalGen1Needed + intermediateMountsToLevel;
    const totalXpNeeded = totalMountsToLevel * getXpForLevel(parentLevel);
    // Total matings = Gen 1 cross-breed pairings + cascade step pairings
    const gen1Pairings = Math.ceil(totalGen1Needed / 2);
    const cascadePairings = cascadeSteps.reduce((sum, s) => sum + Math.max(1, Math.ceil(s.pairs)), 0);
    const totalPairs = gen1Pairings + cascadePairings;
    const totalOptimakinaNeeded = useOptimakina ? totalPairs : 0;
    const finalBabies = cascadeSteps.length > 0 ? cascadeSteps[cascadeSteps.length - 1].expectedBabies : 0;

    return {
      cascadeSteps,
      gen1Requirements,
      totalGen1Needed,
      totalPairs,
      totalMountsToLevel,
      totalXpNeeded,
      totalOptimakinaNeeded,
      finalBabies,
      probability: probability * 100,
    };
  }, [selectedMount, parentLevel, useOptimakina, useReproducteur, useCloning, gen1Multiplier, mountMap, userMountMap, calculateGen1Cost]);

  // Group mounts by generation
  const mountsByGeneration = useMemo(() => {
    const grouped = new Map<number, Mount[]>();
    for (const mount of mounts) {
      if (mount.generation > 1) {
        const gen = mount.generation;
        if (!grouped.has(gen)) grouped.set(gen, []);
        grouped.get(gen)!.push(mount);
      }
    }
    return grouped;
  }, [mounts]);

  const handleTypeChange = (type: string) => {
    setSelectedMountId("");
    router.push(`/optimizer?type=${type}`);
  };

  // Optimal level analysis
  const levelAnalysis = useMemo(() => {
    const xpPerSec = XP_TIERS.find(t => t.tier === xpTier)?.xpPerSec || 1;
    return findOptimalLevel(xpPerSec, useOptimakina, useReproducteur);
  }, [xpTier, useOptimakina, useReproducteur]);

  // Enclosure timeline
  const enclosureTimeline = useMemo(() => {
    if (!analysis) return null;
    return calculateEnclosureTimeline(xpTier, parentLevel, numEnclosures, analysis.totalMountsToLevel, initialSerenity);
  }, [xpTier, parentLevel, numEnclosures, analysis, initialSerenity]);

  // Tier comparison: calculate cost + time for each tier
  const tierComparison = useMemo(() => {
    if (!analysis || !hasFuelPrices) return null;
    return XP_TIERS.map(tierConfig => {
      const timeline = calculateEnclosureTimeline(
        tierConfig.tier, parentLevel, numEnclosures,
        analysis.totalMountsToLevel, initialSerenity,
      );
      const fuelNeeds = calculateTieredFuelNeeds(
        timeline.phases, timeline.remainingXp, tierConfig.tier, timeline.batches, tieredGaugePrices,
      );
      const optimakinaCost = useOptimakina ? Math.ceil(analysis.totalPairs) * prices.optimakinaPrice : 0;
      return {
        tier: tierConfig.tier,
        label: tierConfig.label,
        xpPerSec: tierConfig.xpPerSec,
        totalTime: timeline.totalTime,
        fuelCost: fuelNeeds.totalCost,
        optimakinaCost,
        totalCost: fuelNeeds.totalCost + optimakinaCost,
        batches: timeline.batches,
      };
    });
  }, [analysis, hasFuelPrices, parentLevel, numEnclosures, initialSerenity, tieredGaugePrices, useOptimakina, prices.optimakinaPrice]);

  const formatNumber = (n: number) => n.toLocaleString("fr-FR");
  const formatKamas = (k: number) => {
    if (k >= 1_000_000) return `${(k / 1_000_000).toFixed(1)}M`;
    if (k >= 1000) return `${(k / 1000).toFixed(0)}K`;
    return k.toString();
  };
  const formatSeconds = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}j ${remainingHours}h`;
    }
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  };
  const formatTime = (xp: number) => {
    const xpPerSec = XP_TIERS.find(t => t.tier === xpTier)?.xpPerSec || 1;
    const seconds = xp / xpPerSec;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}j ${remainingHours}h`;
    }
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  };

  // Save / Load / Delete plans
  const handleSave = () => {
    if (!selectedMountId) return;
    startTransition(async () => {
      await saveBreedingPlan({
        mountId: parseInt(selectedMountId),
        parentLevel,
        xpTier,
        numEnclosures,
        gen1Multiplier,
        useCloning,
        useOptimakina,
        useReproducteur,
      });
      router.refresh();
    });
  };

  const handleDeletePlan = (planId: number) => {
    startTransition(async () => {
      await deleteBreedingPlan(planId);
      router.refresh();
    });
  };

  const handleLoadPlan = (plan: SavedPlan) => {
    // Switch type if needed
    if (plan.mount.type !== currentType) {
      router.push(`/optimizer?type=${plan.mount.type}&target=${plan.mountId}`);
      return;
    }
    setSelectedMountId(plan.mountId.toString());
    setParentLevel(plan.parentLevel);
    setXpTier(plan.xpTier);
    setNumEnclosures(plan.numEnclosures);
    setGen1Multiplier(plan.gen1Multiplier);
    setUseCloning(plan.useCloning);
    setUseOptimakina(plan.useOptimakina);
    setUseReproducteur(plan.useReproducteur);
  };

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Configuration</CardTitle>
              <div className="flex gap-2">
                {selectedMountId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    disabled={isPending}
                  >
                    💾 Sauvegarder
                  </Button>
                )}
                <Button
                  variant={advancedMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAdvancedMode(!advancedMode)}
                >
                {advancedMode ? "⚙ Avancé" : "⚡ Simple"}
              </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Target Mount */}
            <div className="space-y-2">
              <Label>Monture cible</Label>
              <Select value={selectedMountId} onValueChange={(v) => setSelectedMountId(v ?? "")}>
                <SelectTrigger>
                  {selectedMount ? (
                    <div className="flex items-center gap-2">
                      {selectedMount.imageUrl && (
                        <img src={selectedMount.imageUrl} alt="" className="w-6 h-6 object-contain" />
                      )}
                      {selectedMount.name}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Sélectionner...</span>
                  )}
                </SelectTrigger>
                <SelectContent className="min-w-[350px] max-h-[400px]">
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
                                <img src={mount.imageUrl} alt="" className="w-6 h-6 object-contain" />
                              )}
                              {mount.name}
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gen 1 Multiplier */}
            <div className="space-y-2">
              <Label>Multiplicateur Gen 1</Label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 5, 10, 20, 50].map((m) => (
                  <Button
                    key={m}
                    variant={gen1Multiplier === m ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGen1Multiplier(m)}
                  >
                    ×{m}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Stock de base pour les montures Gen 1
              </p>
            </div>

            <Separator />

            {/* Parent Level */}
            <div className="space-y-2">
              <Label>Niveau des parents</Label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  value={parentLevel}
                  onChange={(e) => setParentLevel(parseInt(e.target.value))}
                  min={1}
                  max={200}
                  step={1}
                  className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <span className="font-bold w-12 text-center">{parentLevel}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                XP/monture : {formatNumber(getXpForLevel(parentLevel))} ({formatTime(getXpForLevel(parentLevel))})
              </p>
            </div>

            {/* XP Tier */}
            <div className="space-y-2">
              <Label>Barre d'XP utilisée</Label>
              <div className="grid grid-cols-4 gap-2">
                {XP_TIERS.map((t) => (
                  <Button
                    key={t.tier}
                    variant={xpTier === t.tier ? "default" : "outline"}
                    size="sm"
                    onClick={() => setXpTier(t.tier)}
                    className="flex flex-col h-auto py-2"
                  >
                    <span className="font-bold">{t.label}</span>
                    <span className="text-xs opacity-70">{t.description}</span>
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Plus le tier est élevé, plus le leveling est rapide (mais plus cher)
              </p>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>✂ Clonage des stériles</Label>
                  <p className="text-xs text-muted-foreground">×1.5→×2 selon paires dispo</p>
                </div>
                <Switch checked={useCloning} onCheckedChange={setUseCloning} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>⚗ Optimakina</Label>
                  <p className="text-xs text-muted-foreground">+10% de chance</p>
                </div>
                <Switch checked={useOptimakina} onCheckedChange={setUseOptimakina} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>♻ Reproducteur</Label>
                  <p className="text-xs text-muted-foreground">2 bébés au lieu de 1</p>
                </div>
                <Switch checked={useReproducteur} onCheckedChange={setUseReproducteur} />
              </div>
            </div>

            <Separator />

            {/* Enclosures */}
            <div className="space-y-2">
              <Label>Nombre d'enclos</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <Button
                    key={n}
                    variant={numEnclosures === n ? "default" : "outline"}
                    size="sm"
                    className="w-9 h-9 p-0"
                    onClick={() => setNumEnclosures(n)}
                  >
                    {n}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {numEnclosures * MOUNTS_PER_ENCLOSURE} montures en simultané
              </p>
            </div>

            {/* Initial Serenity */}
            <div className="space-y-2">
              <Label>Sérénité initiale des montures</Label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={-5000}
                  max={5000}
                  step={100}
                  value={initialSerenity}
                  onChange={(e) => setInitialSerenity(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className={`font-mono text-sm w-16 text-right ${initialSerenity < 0 ? "text-red-500" : initialSerenity > 0 ? "text-green-500" : ""}`}>
                  {initialSerenity > 0 ? "+" : ""}{initialSerenity}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>-5000</span>
                <button className="underline" onClick={() => setInitialSerenity(0)}>Réinitialiser à 0</button>
                <span>+5000</span>
              </div>
            </div>

            {/* Resource Prices */}
            <div className="space-y-2">
              <Label>Prix serveur (kamas)</Label>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-40">Optimakina (unité)</span>
                  <input
                    type="number"
                    min={0}
                    value={prices.optimakinaPrice || ""}
                    onChange={(e) => updatePrice("optimakinaPrice", parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-24 h-8 rounded-md border bg-background px-2 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">k</span>
                </div>
              </div>
              {hasFuelPrices ? (
                <p className="text-xs text-green-600">
                  Prix carburants chargés depuis la <a href="/carburants" className="underline">page Carburants</a>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Renseignez les prix de vos carburants sur la <a href="/carburants" className="underline">page Carburants</a> pour la comparaison des tiers
                </p>
              )}
            </div>

            <Separator />

            {/* Probability display */}
            {analysis && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Probabilité par accouplement</div>
                <div className="text-3xl font-bold text-primary">
                  {analysis.probability.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Base 30% + {(parentLevel * 2 * LEVEL_BONUS_PER_LEVEL).toFixed(1)}% (niv.)
                  {useOptimakina && " + 10% (Opti)"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-6">
          {analysis && selectedMount && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-primary">
                      {formatNumber(analysis.totalGen1Needed)}
                    </div>
                    <div className="text-sm text-muted-foreground">Captures Gen 1</div>
                    <div className="text-xs text-muted-foreground">(1 par espèce)</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-500">
                      {formatNumber(analysis.totalMountsToLevel)}
                    </div>
                    <div className="text-sm text-muted-foreground">À monter niv. {parentLevel}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-amber-500">
                      {formatNumber(analysis.totalXpNeeded)}
                    </div>
                    <div className="text-sm text-muted-foreground">XP totale</div>
                    <div className="text-xs text-muted-foreground">
                      {enclosureTimeline ? `~${formatSeconds(enclosureTimeline.totalTime)}` : `~${formatTime(analysis.totalXpNeeded)}`}
                    </div>
                  </CardContent>
                </Card>
                <Card className={analysis.finalBabies < 1 ? "border-red-500" : ""}>
                  <CardContent className="pt-6">
                    <div className={`text-2xl font-bold ${getBabyColor(analysis.finalBabies)}`}>
                      {analysis.finalBabies.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">Bébés attendus</div>
                    {analysis.finalBabies < 1 && (
                      <div className="text-xs text-red-500">⚠ Risque d'échec</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Gen 1 Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle>🎯 Captures Gen 1 requises</CardTitle>
                  <CardDescription>
                    Capturez ou achetez ces montures sauvages (1 par espèce, sexes opposés entre parents)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {analysis.gen1Requirements.map(({ mount, needed, owned }) => {
                      const missing = Math.max(0, needed - owned);
                      return (
                        <div
                          key={mount.id}
                          className={`p-3 rounded-lg border ${
                            missing === 0
                              ? "bg-green-500/10 border-green-500"
                              : "bg-amber-500/10 border-amber-500"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {mount.imageUrl && (
                              <img src={mount.imageUrl} alt="" className="w-10 h-10 object-contain" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{mount.name}</p>
                            </div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className={missing > 0 ? "text-red-500" : "text-green-500"}>
                              {owned}/{needed}
                            </span>
                            {missing > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                -{missing}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Snowball Cascade */}
              <Card>
                <CardHeader>
                  <CardTitle>🔄 Cascade de reproduction</CardTitle>
                  <CardDescription>
                    Progression étape par étape avec probabilités
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.cascadeSteps.map((step, index) => {
                      const parent1 = mountMap.get(step.mount.parent1Id!);
                      const parent2 = mountMap.get(step.mount.parent2Id!);
                      const isLast = index === analysis.cascadeSteps.length - 1;

                      return (
                        <div key={step.mount.id}>
                          <div className={`p-4 rounded-lg border ${getBabyBg(step.expectedBabies)}`}>
                            {/* Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="font-mono">
                                  GEN {step.mount.generation}
                                </Badge>
                                {step.mount.imageUrl && (
                                  <img src={step.mount.imageUrl} alt="" className="w-10 h-10 object-contain" />
                                )}
                                <div>
                                  <p className="font-medium">{step.mount.name}</p>
                                  {step.ownedPairs > 0 && (
                                    <p className="text-xs text-green-500 font-medium">
                                      ✓ {step.ownedPairs} paire{step.ownedPairs > 1 ? "s" : ""} en stock
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-2xl font-bold ${getBabyColor(step.feedsNext)}`}>
                                  {step.feedsNext.toFixed(2)}
                                </div>
                                {step.ownedPairs > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    {step.bredSupply.toFixed(2)} élevés + {step.ownedPairs} en stock
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Owned mount warning */}
                            {step.ownedPairs > 0 && (
                              <div className="mb-3 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600 dark:text-amber-400">
                                ⚠ Utiliser vos {step.mount.name} les rendra <strong>stériles</strong> après accouplement.
                              </div>
                            )}

                            {/* Parents */}
                            <div className="flex items-center gap-2 mb-3 text-sm">
                              <span className="text-muted-foreground">Recette :</span>
                              <div className="flex items-center gap-1">
                                {parent1?.imageUrl && <img src={parent1.imageUrl} alt="" className="w-5 h-5" />}
                                <span>{parent1?.name}</span>
                              </div>
                              <span>+</span>
                              <div className="flex items-center gap-1">
                                {parent2?.imageUrl && <img src={parent2.imageUrl} alt="" className="w-5 h-5" />}
                                <span>{parent2?.name}</span>
                              </div>
                            </div>

                            {/* Calculation breakdown */}
                            <div className="flex flex-wrap items-center gap-2 text-sm bg-background/50 rounded p-2">
                              <span className="font-mono">{step.pairs.toFixed(1)} paires</span>
                              {useCloning && (
                                <>
                                  <span className="text-muted-foreground">×</span>
                                  <span className="font-mono text-purple-500">
                                    {step.cloneMultiplier.toFixed(2)} clone
                                  </span>
                                </>
                              )}
                              <span className="text-muted-foreground">=</span>
                              <span className="font-mono">{step.attempts.toFixed(1)} tentatives</span>
                              <span className="text-muted-foreground">×</span>
                              <span className="font-mono text-blue-500">{step.probability.toFixed(1)}%</span>
                              {useReproducteur && (
                                <>
                                  <span className="text-muted-foreground">×</span>
                                  <span className="font-mono text-green-500">2 repro</span>
                                </>
                              )}
                              <span className="text-muted-foreground">=</span>
                              <span className={`font-mono font-bold ${getBabyColor(step.expectedBabies)}`}>
                                {step.expectedBabies.toFixed(2)} bébés
                              </span>
                            </div>
                          </div>

                          {/* Arrow to next step */}
                          {!isLast && (
                            <div className="flex items-center justify-center py-2">
                              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 5v14M5 12l7 7 7-7" />
                                </svg>
                                <span>{step.feedsNext.toFixed(1)} alimentent l'étape suivante</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Warning if chain might fail */}
                  {analysis.finalBabies < 0.5 && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
                      ⚠ Attention : Moins de 0.5 bébé attendu au bout de la chaîne.
                      Augmentez le multiplicateur Gen 1 ou le niveau des parents.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resources Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>📦 Ressources totales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Accouplements</div>
                      <div className="text-xl font-bold">{formatNumber(analysis.totalPairs)}</div>
                    </div>
                    {useOptimakina && (
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">⚗ Optimakina</div>
                        <div className="text-xl font-bold">{formatNumber(analysis.totalOptimakinaNeeded)}</div>
                      </div>
                    )}
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Temps d'XP (Tier {xpTier})</div>
                      <div className="text-xl font-bold">
                        {enclosureTimeline ? formatSeconds(enclosureTimeline.totalTime) : formatTime(analysis.totalXpNeeded)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ({numEnclosures} enclos × {MOUNTS_PER_ENCLOSURE} montures en parallèle)
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Level Optimization Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>📊 Analyse du niveau optimal</CardTitle>
                  <CardDescription>
                    Quel niveau minimise le temps total par bébé obtenu ? (leveling + tentatives ratées)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Recommendation */}
                  <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-primary">
                        Niveau optimal : {levelAnalysis.optimalLevel}
                      </span>
                      {parentLevel === levelAnalysis.optimalLevel ? (
                        <Badge className="bg-green-600">Sélectionné !</Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setParentLevel(levelAnalysis.optimalLevel)}
                        >
                          Appliquer
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Au Tier {xpTier}, le niveau {levelAnalysis.optimalLevel} offre le meilleur ratio
                      temps de leveling / probabilité de succès.
                      Monter plus haut coûte plus de temps que ce que la probabilité supplémentaire rapporte.
                    </p>
                  </div>

                  {/* Comparison Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left py-2 pr-4">Niveau</th>
                          <th className="text-right py-2 px-4">Chance</th>
                          <th className="text-right py-2 px-4">XP / monture</th>
                          <th className="text-right py-2 px-4">Temps / paire</th>
                          <th className="text-right py-2 px-4">Temps / bébé</th>
                          <th className="text-right py-2 pl-4">Efficacité</th>
                        </tr>
                      </thead>
                      <tbody>
                        {levelAnalysis.comparison.map((row) => {
                          const isOptimal = row.level === levelAnalysis.optimalLevel;
                          const isCurrent = row.level === parentLevel;
                          const bestTime = levelAnalysis.comparison.reduce(
                            (min, r) => Math.min(min, r.timePerBaby), Infinity
                          );
                          const efficiency = bestTime / row.timePerBaby * 100;
                          const xpPerSec = XP_TIERS.find(t => t.tier === xpTier)?.xpPerSec || 1;
                          const pairTime = 2 * row.xp / xpPerSec;

                          return (
                            <tr
                              key={row.level}
                              className={`border-b ${
                                isOptimal ? "bg-primary/10 font-medium" :
                                isCurrent ? "bg-blue-500/10" : ""
                              }`}
                            >
                              <td className="py-2 pr-4">
                                <div className="flex items-center gap-2">
                                  {isOptimal && <span title="Optimal">⭐</span>}
                                  {isCurrent && !isOptimal && <span title="Sélectionné">📍</span>}
                                  Niv. {row.level}
                                </div>
                              </td>
                              <td className="text-right py-2 px-4">{row.prob.toFixed(1)}%</td>
                              <td className="text-right py-2 px-4 font-mono text-xs">
                                {formatNumber(row.xp)}
                              </td>
                              <td className="text-right py-2 px-4 text-xs">
                                {formatSeconds(pairTime)}
                              </td>
                              <td className="text-right py-2 px-4 font-mono">
                                {formatSeconds(row.timePerBaby)}
                              </td>
                              <td className="text-right py-2 pl-4">
                                <div className="flex items-center justify-end gap-1">
                                  <div
                                    className={`h-2 rounded-full ${
                                      efficiency >= 95 ? "bg-green-500" :
                                      efficiency >= 70 ? "bg-yellow-500" :
                                      efficiency >= 40 ? "bg-orange-500" : "bg-red-500"
                                    }`}
                                    style={{ width: `${Math.max(8, efficiency * 0.6)}px` }}
                                  />
                                  <span className={`text-xs ${
                                    efficiency >= 95 ? "text-green-500" :
                                    efficiency >= 70 ? "text-yellow-500" : "text-muted-foreground"
                                  }`}>
                                    {efficiency.toFixed(0)}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Le temps / bébé = temps pour monter une paire ÷ probabilité de succès{useReproducteur ? " × 2 bébés (repro)" : ""}.
                    Un niveau bas = leveling rapide mais plus de tentatives ratées.
                    Un niveau haut = moins de ratés mais leveling long.
                  </p>
                </CardContent>
              </Card>

              {/* Enclosure Management */}
              {enclosureTimeline && (
                <Card>
                  <CardHeader>
                    <CardTitle>🏠 Gestion des enclos</CardTitle>
                    <CardDescription>
                      Planning optimal pour préparer vos montures le plus vite possible
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-xs text-muted-foreground">Montures à préparer</div>
                        <div className="text-lg font-bold">{formatNumber(analysis.totalMountsToLevel)}</div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-xs text-muted-foreground">Fournées</div>
                        <div className="text-lg font-bold">{enclosureTimeline.batches}</div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-xs text-muted-foreground">Temps / fournée</div>
                        <div className="text-lg font-bold">{formatSeconds(enclosureTimeline.totalTimePerBatch)}</div>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
                        <div className="text-xs text-muted-foreground">Temps total enclos</div>
                        <div className="text-lg font-bold text-primary">{formatSeconds(enclosureTimeline.totalTime)}</div>
                      </div>
                    </div>

                    {/* Per-round Gantt-style schedule */}
                    {enclosureTimeline.rounds.map((round) => {
                      const xps = XP_TIERS.find(t => t.tier === xpTier)?.xpPerSec || 1;
                      const allPhases = [...enclosureTimeline.phases];
                      if (enclosureTimeline.remainingXp > 0) {
                        allPhases.push({
                          name: "XP restante",
                          gauge1: "Mangeoire (XP)",
                          gauge2: "Libre",
                          duration: enclosureTimeline.remainingXp,
                          statsGained: { endurance: 0, maturity: 0, love: 0, xp: enclosureTimeline.remainingXp, serenity: 0 },
                          description: "",
                          color: "bg-green-500/20 border-green-500",
                        });
                      }
                      const totalDuration = allPhases.reduce((s, p) => s + p.duration, 0);

                      return (
                        <div key={round.roundIndex} className="space-y-3">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <Badge variant="outline">Fournée {round.roundIndex + 1}</Badge>
                            <span className="text-muted-foreground">
                              {round.enclosures.length} enclos actifs &mdash; {round.enclosures.reduce((s, e) => s + e.mountCount, 0)} montures
                            </span>
                          </h4>

                          {/* Gantt bar for each enclosure in this round */}
                          <div className="space-y-2">
                            {round.enclosures.map((enc) => {
                              let elapsed = 0;
                              return (
                                <div key={enc.enclosureIndex} className="space-y-1">
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="font-medium w-20 shrink-0">Enclos {enc.enclosureIndex + 1}</span>
                                    <span className="text-muted-foreground">({enc.mountCount} montures)</span>
                                  </div>
                                  {/* Gantt bar */}
                                  <div className="flex h-8 rounded-md overflow-hidden border">
                                    {allPhases.map((phase, pi) => {
                                      const pct = (phase.duration / totalDuration) * 100;
                                      const phaseStart = elapsed;
                                      elapsed += phase.duration / xps;
                                      const colors = [
                                        "bg-purple-400",
                                        "bg-blue-400",
                                        "bg-purple-300",
                                        "bg-red-400",
                                        "bg-green-400",
                                      ];
                                      return (
                                        <div
                                          key={pi}
                                          className={`${colors[pi] || "bg-muted"} flex items-center justify-center text-[10px] font-medium text-white overflow-hidden`}
                                          style={{ width: `${pct}%` }}
                                          title={`${phase.name}\n${phase.gauge1} + ${phase.gauge2}\n${formatSeconds(phase.duration / xps)}`}
                                        >
                                          {pct > 8 && <span className="truncate px-1">P{pi + 1}</span>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Legend for this round */}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-1">
                            {allPhases.map((phase, pi) => {
                              const colors = [
                                "bg-purple-400",
                                "bg-blue-400",
                                "bg-purple-300",
                                "bg-red-400",
                                "bg-green-400",
                              ];
                              return (
                                <div key={pi} className="flex items-center gap-1.5">
                                  <div className={`w-3 h-3 rounded-sm ${colors[pi] || "bg-muted"}`} />
                                  <span>P{pi + 1}: {phase.name} ({formatSeconds(phase.duration / xps)})</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    <Separator />

                    {/* Phase details */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Détail des phases (par enclos) :</h4>
                      {(() => {
                        const xps = XP_TIERS.find(t => t.tier === xpTier)?.xpPerSec || 1;
                        let cumulTime = 0;
                        return enclosureTimeline.phases.map((phase, index) => {
                          const phaseDuration = phase.duration / xps;
                          const startTime = cumulTime;
                          cumulTime += phaseDuration;

                          return (
                            <div key={index} className={`p-3 rounded-lg border ${phase.color}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="font-mono text-xs">
                                    Phase {index + 1}
                                  </Badge>
                                  <span className="font-medium text-sm">{phase.name}</span>
                                </div>
                                <div className="text-right text-xs">
                                  <div className="font-mono font-bold">{formatSeconds(phaseDuration)}</div>
                                  <div className="text-muted-foreground">{formatSeconds(startTime)} &rarr; {formatSeconds(cumulTime)}</div>
                                </div>
                              </div>

                              <div className="flex gap-4 text-xs mb-2">
                                <span className="bg-background/60 px-2 py-1 rounded">
                                  Jauge 1 : <span className="font-medium">{phase.gauge1}</span>
                                </span>
                                <span className="bg-background/60 px-2 py-1 rounded">
                                  Jauge 2 : <span className="font-medium">{phase.gauge2}</span>
                                </span>
                              </div>

                              <p className="text-xs text-muted-foreground">{phase.description}</p>

                              <div className="flex gap-3 mt-2 text-xs">
                                {phase.statsGained.endurance > 0 && (
                                  <span className="text-yellow-500">Endurance +{formatNumber(phase.statsGained.endurance)}</span>
                                )}
                                {phase.statsGained.maturity > 0 && (
                                  <span className="text-blue-500">Maturité +{formatNumber(phase.statsGained.maturity)}</span>
                                )}
                                {phase.statsGained.love > 0 && (
                                  <span className="text-red-500">Amour +{formatNumber(phase.statsGained.love)}</span>
                                )}
                                {phase.statsGained.xp > 0 && (
                                  <span className="text-green-500">XP +{formatNumber(phase.statsGained.xp)}</span>
                                )}
                                {phase.statsGained.serenity !== 0 && (
                                  <span className="text-purple-500">
                                    Sérénité {phase.statsGained.serenity > 0 ? "+" : ""}{formatNumber(phase.statsGained.serenity)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}

                      {enclosureTimeline.remainingXp > 0 && (
                        <div className="p-3 rounded-lg border bg-green-500/20 border-green-500">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs">
                                Phase 5
                              </Badge>
                              <span className="font-medium text-sm">XP restante</span>
                            </div>
                            <span className="text-sm font-mono">{formatSeconds(enclosureTimeline.additionalXpTime)}</span>
                          </div>
                          <div className="flex gap-4 text-xs mb-2">
                            <span className="bg-background/60 px-2 py-1 rounded">
                              Jauge 1 : <span className="font-medium">Mangeoire (XP)</span>
                            </span>
                            <span className="bg-background/60 px-2 py-1 rounded">
                              Jauge 2 : <span className="font-medium">Libre</span>
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Il manque {formatNumber(enclosureTimeline.remainingXp)} XP pour le niveau {parentLevel}
                          </p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* XP summary */}
                    <div className="p-3 bg-muted rounded-lg space-y-1">
                      <div className="text-sm font-medium mb-2">Bilan XP par monture</div>
                      <div className="flex justify-between text-sm">
                        <span>XP gagnée pendant les stats</span>
                        <span className="font-mono">{formatNumber(enclosureTimeline.xpGainedDuringStats)} XP</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>XP requise pour niv. {parentLevel}</span>
                        <span className="font-mono">{formatNumber(getXpForLevel(parentLevel))} XP</span>
                      </div>
                      {enclosureTimeline.remainingXp > 0 ? (
                        <div className="flex justify-between text-sm text-amber-500">
                          <span>XP manquante</span>
                          <span className="font-mono">-{formatNumber(enclosureTimeline.remainingXp)} XP</span>
                        </div>
                      ) : (
                        <div className="flex justify-between text-sm text-green-500">
                          <span>XP suffisante pendant les stats !</span>
                          <span className="font-mono">+{formatNumber(-enclosureTimeline.remainingXp)} surplus</span>
                        </div>
                      )}
                    </div>

                    {/* Comparison vs naive */}
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm font-medium mb-2">Gain vs stratégie naïve (1 stat à la fois + XP séparée)</div>
                      <div className="flex justify-between text-sm">
                        <span>Stratégie naïve</span>
                        <span className="font-mono text-muted-foreground">{formatSeconds(enclosureTimeline.naiveTotalTime)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Stratégie optimale</span>
                        <span className="font-mono text-primary">{formatSeconds(enclosureTimeline.totalTime)}</span>
                      </div>
                      {enclosureTimeline.timeSaved > 0 && (
                        <div className="flex justify-between text-sm text-green-500 mt-1 pt-1 border-t">
                          <span>Temps économisé</span>
                          <span className="font-mono font-bold">{formatSeconds(enclosureTimeline.timeSaved)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!selectedMount && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Sélectionnez une monture cible pour voir l'analyse d'optimisation
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tier Comparison */}
      {tierComparison && (
        <Card className="border-blue-500/20">
          <CardHeader>
            <CardTitle>Comparaison des Tiers XP</CardTitle>
            <CardDescription>Temps vs coût pour chaque tier — basé sur vos prix carburants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {tierComparison.map((tc) => {
                const isActive = tc.tier === xpTier;
                const isCheapest = tc.totalCost === Math.min(...tierComparison.map(t => t.totalCost));
                const isFastest = tc.totalTime === Math.min(...tierComparison.map(t => t.totalTime));
                return (
                  <div
                    key={tc.tier}
                    onClick={() => setXpTier(tc.tier)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      isActive
                        ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg">{tc.label}</span>
                      <div className="flex gap-1">
                        {isCheapest && <Badge variant="outline" className="text-[10px] px-1 text-green-500 border-green-500/30">Eco</Badge>}
                        {isFastest && <Badge variant="outline" className="text-[10px] px-1 text-blue-500 border-blue-500/30">Rapide</Badge>}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">{tc.xpPerSec * 10} XP / 10s</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Temps</span>
                        <span className="font-mono font-medium">{formatSeconds(tc.totalTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Carburants</span>
                        <span className="font-mono text-amber-500">{formatKamas(tc.fuelCost)} k</span>
                      </div>
                      {tc.optimakinaCost > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Optimakinas</span>
                          <span className="font-mono text-amber-500">{formatKamas(tc.optimakinaCost)} k</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t pt-1 mt-1">
                        <span className="font-medium">Total</span>
                        <span className="font-mono font-bold text-amber-500">{formatKamas(tc.totalCost)} k</span>
                      </div>
                    </div>
                    {tc.tier > 1 && tierComparison[0] && (
                      <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                        <span className={tc.totalTime < tierComparison[0].totalTime ? "text-green-500" : ""}>
                          {formatSeconds(tierComparison[0].totalTime - tc.totalTime)} plus rapide
                        </span>
                        <span className="mx-1">|</span>
                        <span className={tc.totalCost > tierComparison[0].totalCost ? "text-red-500" : "text-green-500"}>
                          {tc.totalCost > tierComparison[0].totalCost ? "+" : ""}{formatKamas(tc.totalCost - tierComparison[0].totalCost)} k
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shopping List */}
      {analysis && enclosureTimeline && (hasFuelPrices || prices.optimakinaPrice > 0) && (
        <Card className="border-amber-500/20">
          <CardHeader>
            <CardTitle>🛒 Liste de courses</CardTitle>
            <CardDescription>Estimation des ressources et coûts en kamas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const fuelNeeds = calculateTieredFuelNeeds(
                enclosureTimeline.phases,
                enclosureTimeline.remainingXp,
                xpTier,
                enclosureTimeline.batches,
                tieredGaugePrices,
              );
              const optimakinaCount = useOptimakina ? Math.ceil(analysis.totalPairs) : 0;
              const fuelCost = fuelNeeds.totalCost;
              const optimakinaCost = optimakinaCount * prices.optimakinaPrice;
              const totalCost = fuelCost + optimakinaCost;

              const formatKamas = (k: number) => {
                if (k >= 1_000_000) return `${(k / 1_000_000).toFixed(1)}M`;
                if (k >= 1000) return `${(k / 1000).toFixed(0)}K`;
                return k.toString();
              };

              const TIER_LABELS: Record<string, string> = {
                Extrait: "Extrait (T1)",
                Philtre: "Philtre (T2)",
                Potion: "Potion (T3)",
                "Élixir": "Élixir (T4)",
              };

              return (
                <>
                  {/* Fuel breakdown by gauge */}
                  {hasFuelPrices && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Carburants par jauge</h4>
                      <div className="grid gap-1">
                        {FUEL_TYPES.map((ft) => {
                          const gaugeKey = ft.key.charAt(0).toUpperCase() + ft.key.slice(1);
                          const result = fuelNeeds.gaugeResults[gaugeKey];
                          if (!result || result.totalDurability === 0) return null;
                          return (
                            <div key={ft.key} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{ft.label}</span>
                              <div className="flex gap-4">
                                <span className="font-mono w-20 text-right">{formatNumber(result.totalDurability)} dur.</span>
                                <span className="font-mono w-20 text-right text-amber-500">{result.totalCost > 0 ? `${formatKamas(Math.round(result.totalCost))} k` : "-"}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Breakdown by fuel tier */}
                      {Object.keys(fuelNeeds.fuelTierTotals).length > 1 && (
                        <div className="mt-3 pt-3 border-t">
                          <h4 className="text-sm font-medium mb-1">Répartition par type de carburant</h4>
                          <div className="grid gap-1">
                            {(["Extrait", "Philtre", "Potion", "Élixir"] as const).map((tier) => {
                              const dur = fuelNeeds.fuelTierTotals[tier] || 0;
                              if (dur === 0) return null;
                              return (
                                <div key={tier} className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">{TIER_LABELS[tier]}</span>
                                  <span className="font-mono w-24 text-right">{formatNumber(dur)} dur.</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
                        <span>Total carburants</span>
                        <div className="flex gap-4">
                          <span className="font-mono w-20 text-right">{formatNumber(fuelNeeds.totalDurability)} dur.</span>
                          <span className="font-mono w-20 text-right text-amber-500">{formatKamas(Math.round(fuelCost))} k</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Optimakina */}
                  {prices.optimakinaPrice > 0 && useOptimakina && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Optimakinas</h4>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Optimakina × {optimakinaCount}</span>
                        <span className="font-mono text-amber-500">{formatKamas(optimakinaCost)} k</span>
                      </div>
                    </div>
                  )}

                  {/* Grand total */}
                  <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Coût total estimé</span>
                      <span className="text-xl font-bold text-amber-500">{formatKamas(totalCost)} kamas</span>
                    </div>
                    {analysis.totalMountsToLevel > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>Coût par monture</span>
                        <span className="font-mono">{formatKamas(Math.round(totalCost / analysis.totalMountsToLevel))} k</span>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Saved Plans */}
      {savedPlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Plans sauvegardés</CardTitle>
            <CardDescription>Cliquez sur un plan pour le charger, ou supprimez-le une fois terminé</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {savedPlans.map((plan) => {
                const typeConfig = TYPE_CONFIG[plan.mount.type as keyof typeof TYPE_CONFIG];
                const isActive = selectedMountId === plan.mountId.toString() && currentType === plan.mount.type;
                return (
                  <div
                    key={plan.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isActive
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleLoadPlan(plan)}
                  >
                    {plan.mount.imageUrl && (
                      <img src={plan.mount.imageUrl} alt="" className="w-10 h-10 object-contain shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{plan.mount.name}</div>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-x-2">
                        <span>{typeConfig?.emoji} {typeConfig?.label}</span>
                        <span>Niv. {plan.parentLevel}</span>
                        <span>Tier {plan.xpTier}</span>
                        <span>{plan.numEnclosures} enclos</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-x-2 mt-0.5">
                        {plan.useCloning && <Badge variant="outline" className="text-[10px] px-1 py-0">Clone</Badge>}
                        {plan.useOptimakina && <Badge variant="outline" className="text-[10px] px-1 py-0">Optimakina</Badge>}
                        {plan.useReproducteur && <Badge variant="outline" className="text-[10px] px-1 py-0">Repro</Badge>}
                        <span>×{plan.gen1Multiplier} Gen1</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlan(plan.id);
                      }}
                      disabled={isPending}
                    >
                      ✕
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
