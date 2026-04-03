import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown } from "lucide-react";

export async function Header() {
  const session = await auth();

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">DragoDofus</span>
        </Link>

        <nav className="flex items-center gap-2">
          {session?.user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground">
                  Collections
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>
                    <Link href="/mounts/muldos" className="w-full">
                      🐏 Muldos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/mounts/dragodindes" className="w-full">
                      🐉 Dragodindes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/mounts/volkornes" className="w-full">
                      🦏 Volkornes
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link href="/breeding">
                <Button variant="ghost">Élevage</Button>
              </Link>

              <Link href="/optimizer">
                <Button variant="ghost">Optimiseur</Button>
              </Link>

              <Link href="/stats">
                <Button variant="ghost">Stats</Button>
              </Link>

              <Link href="/carburants">
                <Button variant="ghost">Carburants</Button>
              </Link>

              <Link href="/revente">
                <Button variant="ghost">Revente</Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger className="relative h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {session.user.name?.[0]?.toUpperCase() ||
                        session.user.email?.[0]?.toUpperCase() ||
                        "?"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {session.user.name && (
                        <p className="font-medium">{session.user.name}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                  >
                    <DropdownMenuItem>
                      <button type="submit" className="w-full text-left">
                        Déconnexion
                      </button>
                    </DropdownMenuItem>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Connexion</Button>
              </Link>
              <Link href="/register">
                <Button>Créer un compte</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
