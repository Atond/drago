import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ReventePage } from "@/components/ReventePage";

export default async function Page() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Revente de Montures</h1>
        <p className="text-muted-foreground">
          Calculez la rentabilité du leveling de montures Gen 1 au niveau 100 pour les runes PA/PM.
        </p>
      </div>
      <ReventePage />
    </div>
  );
}
