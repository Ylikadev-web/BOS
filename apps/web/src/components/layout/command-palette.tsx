"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  Building2,
  LayoutDashboard,
  Sparkles,
  Users,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { expedientes, clientes, prospectos } from "@/data/seed";
import { formatCurrency } from "@ylika/shared";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar expedientes, clientes, prospectos…" />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>
        <CommandGroup heading="Navegación">
          <CommandItem onSelect={() => go("/workspace")}>
            <LayoutDashboard /> Workspace
          </CommandItem>
          <CommandItem onSelect={() => go("/prospectos")}>
            <Users /> Prospectos
          </CommandItem>
          <CommandItem onSelect={() => go("/clientes")}>
            <Building2 /> Clientes
          </CommandItem>
          <CommandItem onSelect={() => go("/operaciones")}>
            <BriefcaseBusiness /> Operaciones
          </CommandItem>
          <CommandItem onSelect={() => go("/insights")}>
            <Sparkles /> Insights
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Expedientes">
          {expedientes.map((exp) => (
            <CommandItem
              key={exp.id}
              onSelect={() => go(`/operaciones/${exp.codigo}`)}
            >
              <BriefcaseBusiness />
              <div className="flex flex-col">
                <span>
                  {exp.codigo} · {exp.nombre}
                </span>
                <span className="text-xs text-muted-foreground">
                  {exp.clienteNombre} · {formatCurrency(exp.valor)}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Clientes">
          {clientes.map((c) => (
            <CommandItem key={c.id} onSelect={() => go("/clientes")}>
              <Building2 />
              {c.nombre}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Prospectos">
          {prospectos.map((p) => (
            <CommandItem key={p.id} onSelect={() => go("/prospectos")}>
              <Users />
              {p.nombre}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
