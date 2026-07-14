"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  Building2,
  LayoutDashboard,
  Sparkles,
  Users,
  Landmark,
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
import { useYlikaStore } from "@/lib/store";
import { formatCurrency } from "@ylika/shared";
import { expedienteHref } from "@/lib/routes";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { expedientes, clientes, prospectos } = useYlikaStore();

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
          <CommandItem onSelect={() => go("/licitaciones")}>
            <Landmark /> Licitaciones
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
              onSelect={() => go(expedienteHref(exp.codigo))}
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
            <CommandItem
              key={c.id}
              onSelect={() => go(`/clientes?focus=${encodeURIComponent(c.id)}`)}
            >
              <Building2 />
              <div className="flex flex-col">
                <span>{c.nombre}</span>
                <span className="text-xs text-muted-foreground">
                  {c.codigo} · {c.sector}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Prospectos">
          {prospectos.map((p) => (
            <CommandItem key={p.id} onSelect={() => go("/prospectos")}>
              <Users />
              <div className="flex flex-col">
                <span>{p.nombre}</span>
                <span className="text-xs text-muted-foreground">
                  {p.empresa} · {p.etapa}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
