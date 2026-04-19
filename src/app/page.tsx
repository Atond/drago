import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";

export default async function Home() {
  const session = await auth();

  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-8 max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            DragoDofus
          </h1>
          <p className="text-xl text-muted-foreground">
            Suivez votre collection de Muldos et optimisez vos croisements.
            120 espèces à collecter sur 10 générations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {session?.user ? (
              <Link href="/mounts/muldos">
                <Button size="lg" className="w-full sm:w-auto">
                  Voir ma collection
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Commencer
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    Se connecter
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12">
            <div className="p-6 rounded-lg bg-card border">
              <h3 className="font-semibold mb-2">120 Muldos</h3>
              <p className="text-sm text-muted-foreground">
                Toutes les espèces à travers 10 générations
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border">
              <h3 className="font-semibold mb-2">Suivi personnel</h3>
              <p className="text-sm text-muted-foreground">
                Votre progression sauvegardée en temps réel
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border">
              <h3 className="font-semibold mb-2">Guide des croisements</h3>
              <p className="text-sm text-muted-foreground">
                Visualisez les parents nécessaires
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
