"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateMountCount } from "@/lib/actions";
import { useTransition } from "react";

interface MountCardProps {
  mount: {
    id: number;
    name: string;
    generation: number;
    bonus: string | null;
    imageUrl: string | null;
    parent1?: { name: string } | null;
    parent2?: { name: string } | null;
    breedingCombinations?: unknown;
  };
  userMount?: {
    maleCount: number;
    femaleCount: number;
  } | null;
  mountType: string;
}

export function MountCard({ mount, userMount, mountType }: MountCardProps) {
  const [isPending, startTransition] = useTransition();

  const maleCount = userMount?.maleCount ?? 0;
  const femaleCount = userMount?.femaleCount ?? 0;
  const isComplete = maleCount > 0 && femaleCount > 0;
  const hasAny = maleCount > 0 || femaleCount > 0;

  // Target: Gen 1 = 1M+1F (capturable), Gen 2+ = 2M+2F (1 pair to breed, 1 reserve)
  const targetPerGender = mount.generation === 1 ? 1 : 2;
  const maleOk = maleCount >= targetPerGender;
  const femaleOk = femaleCount >= targetPerGender;
  const targetReached = maleOk && femaleOk;

  const handleUpdate = (field: "maleCount" | "femaleCount", delta: number) => {
    const currentValue = field === "maleCount" ? maleCount : femaleCount;
    const newValue = Math.max(0, currentValue + delta);
    startTransition(async () => {
      await updateMountCount(mount.id, field, newValue, mountType);
    });
  };

  return (
    <Card
      className={`transition-all hover:shadow-lg ${
        targetReached
          ? "border-green-500 bg-green-500/10 ring-1 ring-green-500/20"
          : isComplete
            ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/20"
            : hasAny
              ? "border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/20"
              : "hover:border-muted-foreground/30"
      } ${isPending ? "opacity-70" : ""}`}
    >
      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-center gap-3">
          {mount.imageUrl && (
            <div className="relative w-16 h-16 bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden shrink-0 shadow-sm">
              <img
                src={mount.imageUrl}
                alt={mount.name}
                className="w-full h-full object-contain p-1"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">
              {mount.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={targetReached ? "default" : isComplete ? "secondary" : hasAny ? "secondary" : "outline"}
                className={`text-xs ${targetReached ? "bg-green-600" : isComplete ? "bg-amber-600" : hasAny ? "bg-blue-600" : ""}`}
              >
                Gen {mount.generation}
              </Badge>
              {targetReached ? (
                <span className="text-green-500 text-xs font-medium">✓ Objectif</span>
              ) : isComplete ? (
                <span className="text-amber-500 text-xs">
                  {mount.generation === 1 ? "✓ Complet" : `${maleCount + femaleCount}/${targetPerGender * 2}`}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-2">
        {(() => {
          const combos = Array.isArray(mount.breedingCombinations) ? mount.breedingCombinations as [string, string][] : null;
          if (combos && combos.length > 0) {
            return (
              <div className="space-y-1">
                {combos.map(([p1, p2], i) => (
                  <p key={i} className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                    {p1} × {p2}
                  </p>
                ))}
              </div>
            );
          }
          if (mount.parent1 && mount.parent2) {
            return (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                {mount.parent1.name} × {mount.parent2.name}
              </p>
            );
          }
          return null;
        })()}

        <div className="flex items-center justify-between gap-2 pt-2 border-t">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleUpdate("maleCount", -1)}
              disabled={isPending || maleCount === 0}
            >
              -
            </Button>
            <span className={`w-8 text-center text-sm font-bold ${maleOk ? "text-green-500" : maleCount > 0 ? "text-blue-500" : "text-muted-foreground"}`}>
              {maleCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleUpdate("maleCount", 1)}
              disabled={isPending}
            >
              +
            </Button>
            <span className="text-blue-500 text-sm ml-1">♂</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleUpdate("femaleCount", -1)}
              disabled={isPending || femaleCount === 0}
            >
              -
            </Button>
            <span className={`w-8 text-center text-sm font-bold ${femaleOk ? "text-green-500" : femaleCount > 0 ? "text-pink-500" : "text-muted-foreground"}`}>
              {femaleCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleUpdate("femaleCount", 1)}
              disabled={isPending}
            >
              +
            </Button>
            <span className="text-pink-500 text-sm ml-1">♀</span>
          </div>
        </div>

        {/* Target indicator */}
        <div className="text-[10px] text-muted-foreground text-center pt-1">
          Objectif : {targetPerGender}♂ {targetPerGender}♀
          {mount.generation === 1 ? " (capturable)" : " (1 repro + 1 réserve)"}
        </div>
      </CardContent>
    </Card>
  );
}
