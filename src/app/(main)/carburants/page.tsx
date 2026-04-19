import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CarburantsPage } from "@/components/CarburantsPage";

export default async function Page() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Carburants d'Enclos</h1>
        <p className="text-muted-foreground">
          Tous les carburants disponibles pour recharger les jauges de vos enclos.
          Les prix enregistrés ici sont communs à tous les comptes du site.
        </p>
      </div>
      <CarburantsPage />
    </div>
  );
}
