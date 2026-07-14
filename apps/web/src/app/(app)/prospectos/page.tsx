"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Plus } from "lucide-react";
import { formatCurrency, formatPercent } from "@ylika/shared";
import { cn } from "@/lib/utils";
import { useYlikaStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { expedienteHref } from "@/lib/routes";
import { CreateExpedienteDialog } from "@/components/operaciones/create-expediente-dialog";

const etapaStyle: Record<string, string> = {
  nuevo: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  calificado: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  propuesta: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  negociacion: "bg-ylika-orange-soft text-amber-700 dark:text-amber-400",
  ganado: "bg-ylika-success-soft text-ylika-success",
  perdido: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
};

export default function ProspectosPage() {
  const router = useRouter();
  const { prospectos, convertProspecto, clientes } = useYlikaStore();
  const [expOpen, setExpOpen] = useState(false);
  const [clienteId, setClienteId] = useState<string | undefined>();

  const convert = (id: string) => {
    try {
      const { expediente } = convertProspecto(id);
      toast.success(`Convertido → ${expediente.codigo}`);
      router.push(expedienteHref(expediente.codigo));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo convertir");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium tracking-wide text-ylika-teal uppercase">
            Prospectos
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            Embudo comercial
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Convierte un prospecto en cliente + expediente con un clic.
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {prospectos.map((p) => (
          <article
            key={p.id}
            className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-mono text-xs text-muted-foreground">
                {p.codigo}
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold">
                {p.nombre}
              </h2>
              <p className="text-sm text-muted-foreground">
                {p.empresa} · {p.ejecutivo} · {p.origen}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Valor estimado</p>
                <p className="font-semibold">
                  {formatCurrency(p.valorEstimado)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Probabilidad</p>
                <p className="font-semibold">{formatPercent(p.probabilidad)}</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                  etapaStyle[p.etapa],
                )}
              >
                {p.etapa}
              </span>
              {p.etapa !== "ganado" && p.etapa !== "perdido" ? (
                <Button
                  size="sm"
                  className="gap-1 bg-ylika-teal hover:bg-ylika-teal/90"
                  onClick={() => convert(p.id)}
                >
                  Convertir
                  <ArrowRight className="size-3.5" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => {
                    const cli = clientes.find((c) => c.nombre === p.empresa);
                    setClienteId(cli?.id);
                    setExpOpen(true);
                  }}
                >
                  <Plus className="size-3.5" />
                  Otro expediente
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>

      <CreateExpedienteDialog
        open={expOpen}
        onOpenChange={setExpOpen}
        defaultClienteId={clienteId}
      />
    </div>
  );
}
