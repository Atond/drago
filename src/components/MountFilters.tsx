"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
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

interface MountFiltersProps {
  totalCount: number;
  ownedCount: number;
  completeCount: number;
  totalMountsOwned: number;
  generations: number[];
}

export function MountFilters({
  totalCount,
  ownedCount,
  completeCount,
  totalMountsOwned,
  generations,
}: MountFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
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
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <Input
          placeholder="Rechercher une monture..."
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
            {generations.map((gen) => (
              <SelectItem key={gen} value={String(gen)}>
                Génération {gen}
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
            onClick={() => router.push(pathname)}
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
          Total : <strong className="text-foreground">{totalMountsOwned}</strong>
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
