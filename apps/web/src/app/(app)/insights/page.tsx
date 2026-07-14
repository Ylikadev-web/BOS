"use client";

import Link from "next/link";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { useYlikaStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function InsightsPage() {
  const { expedientes } = useYlikaStore();
  const insights = expedientes.flatMap((e) =>
    e.insights.map((insight) => ({
      ...insight,
      expedienteCodigo: e.codigo,
      expedienteNombre: e.nombre,
    })),
  );

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
          Riesgos, recomendaciones y señales detectadas por IA a través del
          portafolio.
        </p>
      </div>

      <div className="grid gap-4">
        {insights.map((insight) => (
          <Link
            key={`${insight.expedienteCodigo}-${insight.id}`}
            href={`/operaciones/${insight.expedienteCodigo}`}
            className={cn(
              "block rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md",
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
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
