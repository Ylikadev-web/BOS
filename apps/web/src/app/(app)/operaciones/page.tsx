"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useYlikaStore } from "@/lib/store";
import { ExpedienteCard } from "@/components/operaciones/expediente-card";
import { Button } from "@/components/ui/button";
import { CreateExpedienteDialog } from "@/components/operaciones/create-expediente-dialog";

export default function OperacionesPage() {
  const { expedientes } = useYlikaStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium tracking-wide text-ylika-teal uppercase">
            Operaciones
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            Portafolio de Operaciones
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Cada expediente es una tarjeta viva: cliente, tipo, monto, estado y
            rentabilidad — sin tablas ERP.
          </p>
        </div>
        <Button
          className="gap-2 bg-ylika-teal hover:bg-ylika-teal/90"
          onClick={() => setOpen(true)}
        >
          <Plus className="size-4" />
          Nuevo expediente
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {expedientes.map((exp, i) => (
          <ExpedienteCard key={exp.id} expediente={exp} index={i} />
        ))}
      </div>

      <CreateExpedienteDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
