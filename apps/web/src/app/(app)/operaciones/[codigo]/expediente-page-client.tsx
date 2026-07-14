"use client";

import { notFound } from "next/navigation";
import { useYlikaStore } from "@/lib/store";
import { ExpedienteWorkspace } from "@/components/expediente/expediente-workspace";

export function ExpedientePageClient({ codigo }: { codigo: string }) {
  const { getExpedienteByCodigo, ready } = useYlikaStore();
  const expediente = getExpedienteByCodigo(codigo);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Cargando expediente…
      </div>
    );
  }

  if (!expediente) notFound();

  return <ExpedienteWorkspace expediente={expediente} />;
}
