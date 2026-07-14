"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="ml-1 flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-ylika-teal to-teal-700 text-xs font-semibold text-white outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Menú de usuario"
        >
          AR
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>Ana Ruiz</span>
            <span className="text-xs font-normal text-muted-foreground">
              Ejecutivo comercial · YLIKA
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            toast.message("Perfil", {
              description: "Ana Ruiz · Ejecutivo comercial",
            });
          }}
        >
          <UserRound />
          Ver perfil
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/workspace">
            <Settings />
            Ir a Workspace
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            toast.success("Sesión cerrada (demo)");
            router.push("/workspace");
          }}
        >
          <LogOut />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
