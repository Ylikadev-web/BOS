"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useYlikaStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { expedienteHref } from "@/lib/routes";
import { triggerBrowserDownload } from "@/lib/expediente-actions";

export default function InsightsPage() {
  const { expedientes, runAction } = useYlikaStore();
  const insights = useMemo(
    () =>
      expedientes.flatMap((e) =>
        e.insights
          .filter((i) => !i.resuelto)
          .map((insight) => ({
            ...insight,
            expedienteCodigo: e.codigo,
            expedienteNombre: e.nombre,
          })),
      ),
    [expedientes],
  );

  const apply = (codigo: string, insightId: string) => {
    const result = runAction(codigo, "aplicar_recomendacion", {
      insightId,
    });
    if (!result) {
      toast.error("No se pudo aplicar");
      return;
    }
    if (result.download) triggerBrowserDownload(result.download);
    toast.success(result.message);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-ylika-teal uppercase">
          Insights
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Inteligencia operativa
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Cada recomendación se puede aplicar y modifica el expediente.
        </p>
      </div>

      <div className="grid gap-4">
        {insights.length === 0 && (
          <p className="rounded-2xl border border-border/80 bg-card p-6 text-sm text-muted-foreground">
            No hay insights abiertos en el portafolio.
          </p>
        )}
        {insights.map((insight) => (
          <div
            key={`${insight.expedienteCodigo}-${insight.id}`}
            className={cn(
              "rounded-2xl border p-5",
              insight.severidad === "critical" &&
                "border-ylika-orange/40 bg-ylika-orange-soft",
              insight.severidad === "warning" &&
                "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
              insight.severidad === "info" && "border-border/80 bg-card",
            )}
          >
            <div className="flex items-start gap-3">
              {insight.severidad === "critical" ? (
                <ShieldAlert className="mt-0.5 size-5 text-amber-700 dark:text-amber-400" />
              ) : insight.severidad === "warning" ? (
                <AlertTriangle className="mt-0.5 size-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <Info className="mt-0.5 size-5 text-ylika-teal" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{insight.titulo}</h2>
                  <span className="font-mono text-xs text-muted-foreground">
                    {insight.expedienteCodigo}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {insight.expedienteNombre}
                </p>
                <p className="mt-2 text-sm">{insight.descripcion}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Recomendación: {insight.recomendacion}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="bg-ylika-teal hover:bg-ylika-teal/90"
                    onClick={() =>
                      apply(insight.expedienteCodigo, insight.id)
                    }
                  >
                    Aplicar
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={expedienteHref(insight.expedienteCodigo)}>
                      Abrir expediente
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      runAction(insight.expedienteCodigo, "descartar_insight", {
                        insightId: insight.id,
                      });
                      toast.success("Insight descartado");
                    }}
                  >
                    Descartar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
