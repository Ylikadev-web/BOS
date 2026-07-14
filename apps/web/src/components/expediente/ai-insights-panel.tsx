"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Info, ShieldAlert, Sparkles } from "lucide-react";
import type { AiInsight, ResumenFinanciero } from "@ylika/shared";
import { formatCurrency, formatPercent } from "@ylika/shared";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useYlikaStore } from "@/lib/store";
import { triggerBrowserDownload } from "@/lib/expediente-actions";
import { toast } from "sonner";

export function AiInsightsPanel({
  insights,
  resumen,
  expedienteCodigo,
}: {
  insights: AiInsight[];
  resumen: ResumenFinanciero;
  expedienteCodigo: string;
}) {
  const { runAction } = useYlikaStore();
  const active = insights.filter((i) => !i.resuelto);

  const apply = (insight: AiInsight) => {
    const result = runAction(expedienteCodigo, "aplicar_recomendacion", {
      insightId: insight.id,
    });
    if (!result) {
      toast.error("No se pudo aplicar");
      return;
    }
    if (result.download) triggerBrowserDownload(result.download);
    if (result.focusFinanzas) {
      document
        .getElementById("finanzas-panel")
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    toast.success(result.message);
  };

  const dismiss = (insightId: string) => {
    const result = runAction(expedienteCodigo, "descartar_insight", {
      insightId,
    });
    if (result) toast.success(result.message);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="size-3.5 text-ylika-teal" />
          <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            AI Insights
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Señales vivas del expediente
        </p>
      </div>

      <div className="space-y-3">
        {active.length === 0 && (
          <p className="rounded-xl border border-border/80 bg-secondary/40 p-4 text-sm text-muted-foreground">
            Sin señales abiertas. El expediente está limpio.
          </p>
        )}
        {active.map((insight, index) => (
          <motion.article
            key={insight.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * index }}
            className={cn(
              "rounded-xl border p-4",
              insight.severidad === "critical" &&
                "border-ylika-orange/40 bg-ylika-orange-soft",
              insight.severidad === "warning" &&
                "border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30",
              insight.severidad === "info" && "border-border bg-card",
            )}
          >
            <div className="flex items-start gap-2">
              <SeverityIcon severidad={insight.severidad} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold tracking-tight">{insight.titulo}</p>
                {insight.entidadRelacionada && (
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {insight.entidadRelacionada}
                  </p>
                )}
                <p className="mt-2 text-sm text-foreground/80">
                  {insight.descripcion}
                </p>
                <div className="mt-3 space-y-1.5 text-xs">
                  <p>
                    <span className="font-medium text-muted-foreground">
                      Impacto:{" "}
                    </span>
                    {insight.impacto}
                  </p>
                  <p>
                    <span className="font-medium text-muted-foreground">
                      Recomendación:{" "}
                    </span>
                    {insight.recomendacion}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="bg-ylika-teal hover:bg-ylika-teal/90"
                    onClick={() => apply(insight)}
                  >
                    Aplicar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => dismiss(insight.id)}
                  >
                    Descartar
                  </Button>
                </div>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      <div
        id="finanzas-panel"
        className="mt-auto rounded-xl border border-border/80 bg-card p-4"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Finanzas actuales
        </h3>
        <dl className="mt-3 space-y-2 text-sm">
          <FinRow label="Vendido" value={formatCurrency(resumen.montoVendido)} />
          <FinRow
            label="Comprado"
            value={formatCurrency(resumen.montoComprado)}
          />
          <FinRow
            label="Cobrado"
            value={formatCurrency(resumen.cobradoCliente)}
          />
          <FinRow
            label="Pagado"
            value={formatCurrency(resumen.pagadoProveedor)}
          />
          <div className="border-t border-border/70 pt-2">
            <FinRow
              label="Margen"
              value={formatPercent(resumen.margen)}
              emphasize
            />
          </div>
        </dl>
      </div>
    </div>
  );
}

function FinRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "font-medium tabular-nums",
          emphasize && "text-ylika-teal",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function SeverityIcon({ severidad }: { severidad: AiInsight["severidad"] }) {
  if (severidad === "critical") {
    return <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-700" />;
  }
  if (severidad === "warning") {
    return <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />;
  }
  return <Info className="mt-0.5 size-4 shrink-0 text-ylika-teal" />;
}
