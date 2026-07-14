"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useYlikaStore } from "@/lib/store";
import { ExpedienteWorkspace } from "@/components/expediente/expediente-workspace";

function VerExpedienteInner() {
  const params = useSearchParams();
  const codigo = params.get("codigo") ?? "";
  const { getExpedienteByCodigo, ready } = useYlikaStore();
  const expediente = codigo ? getExpedienteByCodigo(codigo) : undefined;

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Cargando expediente…
      </div>
    );
  }

  if (!codigo) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-8 text-center">
        <p className="font-medium">Falta el código del expediente</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Usa el portafolio de Operaciones para abrir uno.
        </p>
      </div>
    );
  }

  if (!expediente) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-8 text-center">
        <p className="font-[family-name:var(--font-display)] text-xl font-semibold">
          Expediente no encontrado
        </p>
        <p className="mt-2 font-mono text-sm text-muted-foreground">{codigo}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Puede que se haya creado en otro navegador o se borró el almacenamiento local.
        </p>
      </div>
    );
  }

  return <ExpedienteWorkspace expediente={expediente} />;
}

export default function VerExpedientePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Cargando…
        </div>
      }
    >
      <VerExpedienteInner />
    </Suspense>
  );
}
