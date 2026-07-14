"use client";

import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Gauge,
  TrendingUp,
} from "lucide-react";
import type { ExpedienteNegocio } from "@ylika/shared";
import { formatCurrency, formatPercent } from "@ylika/shared";
import { StatusPill } from "@/components/operaciones/status-pill";
import { ExpedienteTimeline } from "@/components/expediente/expediente-timeline";
import { BusinessGraph } from "@/components/expediente/business-graph";
import { AiInsightsPanel } from "@/components/expediente/ai-insights-panel";

export function ExpedienteWorkspace({
  expediente,
}: {
  expediente: ExpedienteNegocio;
}) {
  return (
    <div className="space-y-5">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border/80 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              {expediente.codigo}
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
              {expediente.nombre}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {expediente.clienteNombre} ·{" "}
              {expediente.tipo === "venta_directa"
                ? "Venta Directa"
                : expediente.tipo === "proyecto"
                  ? "Proyecto"
                  : "Servicio"}{" "}
              · {expediente.ejecutivo}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <HeaderChip
              icon={<CheckCircle2 className="size-3.5 text-ylika-success" />}
              label={`Estado: ${estadoLabel(expediente.estado)}`}
            />
            <HeaderChip
              icon={<Gauge className="size-3.5 text-ylika-teal" />}
              label={`Avance: ${expediente.avance}%`}
            />
            <HeaderChip
              icon={<TrendingUp className="size-3.5 text-sky-600" />}
              label={`Rentabilidad: ${formatPercent(expediente.rentabilidad)}`}
            />
            <HeaderChip
              icon={<Activity className="size-3.5 text-muted-foreground" />}
              label={formatCurrency(expediente.valor)}
            />
            <StatusPill estado={expediente.estado} />
          </div>
        </div>
      </motion.header>

      <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_280px]">
        <aside className="rounded-2xl border border-border/80 bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <ExpedienteTimeline
            events={expediente.timeline}
            expedienteCodigo={expediente.codigo}
            clienteNombre={expediente.clienteNombre}
          />
        </aside>

        <section className="min-h-[520px]">
          <BusinessGraph
            nodes={expediente.graph.nodes}
            edges={expediente.graph.edges}
            expedienteCodigo={expediente.codigo}
            clienteNombre={expediente.clienteNombre}
          />
        </section>

        <aside className="rounded-2xl border border-border/80 bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <AiInsightsPanel
            insights={expediente.insights}
            resumen={expediente.resumen}
          />
        </aside>
      </div>
    </div>
  );
}

function HeaderChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-secondary/60 px-3 py-1.5 text-xs font-medium">
      {icon}
      {label}
    </span>
  );
}

function estadoLabel(estado: ExpedienteNegocio["estado"]) {
  const map = {
    prospecto: "Prospecto",
    cotizacion: "Cotización",
    contrato: "Contrato",
    ejecucion: "En Ejecución",
    cobranza: "Cobranza",
    cerrado: "Cerrado",
    riesgo: "Riesgo",
  };
  return map[estado];
}
