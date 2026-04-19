"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterStatus = "all" | "owned" | "missing" | "complete";

interface MuldoFiltersProps {
  totalCount: number;
  ownedCount: number;
  completeCount: number;
  totalMuldosOwned: number;
}

export function MuldoFilters({
  totalCount,
  ownedCount,
  completeCount,
  totalMuldosOwned,
}: MuldoFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentGeneration = searchParams.get("generation") || "all";
  const currentStatus = (searchParams.get("status") as FilterStatus) || "all";
  const currentSearch = searchParams.get("search") || "";

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all" || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/muldos?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <Input
          placeholder="Rechercher un Muldo..."
          value={currentSearch}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="w-full sm:w-64"
        />

        <Select
          value={currentGeneration}
          onValueChange={(value) => updateFilter("generation", value)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Génération" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {Array.from({ length: 10 }, (_, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>
                Génération {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentStatus}
          onValueChange={(value) => updateFilter("status", value)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="owned">Possédés</SelectItem>
            <SelectItem value="missing">Manquants</SelectItem>
            <SelectItem value="complete">Complets</SelectItem>
          </SelectContent>
        </Select>

        {(currentGeneration !== "all" ||
          currentStatus !== "all" ||
          currentSearch) && (
          <Button
            variant="ghost"
            onClick={() => router.push("/mounts/muldos")}
            className="text-muted-foreground"
          >
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>
          Espèces : <strong className="text-foreground">{totalCount}</strong>
        </span>
        <span>
          Espèces possédées : <strong className="text-foreground">{ownedCount}/{totalCount}</strong>
        </span>
        <span>
          Couples complets : <strong className="text-green-500">{completeCount}/{totalCount}</strong>
        </span>
        <span>
          Total Muldos : <strong className="text-foreground">{totalMuldosOwned}</strong>
        </span>
        <span>
          Progression :{" "}
          <strong className="text-foreground">
            {totalCount > 0 ? Math.round((completeCount / totalCount) * 100) : 0}%
          </strong>
        </span>
      </div>
    </div>
  );
}
