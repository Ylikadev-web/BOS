"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import type { ExpedienteNegocio } from "@ylika/shared";
import { formatCurrency, formatPercent } from "@ylika/shared";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/operaciones/status-pill";
import { expedienteHref } from "@/lib/routes";

export function ExpedienteCard({
  expediente,
  index = 0,
}: {
  expediente: ExpedienteNegocio;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={expedienteHref(expediente.codigo)}
        className="group block rounded-2xl border border-border/80 bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-ylika-teal/30 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs tracking-wide text-muted-foreground">
              {expediente.codigo}
            </p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
              {expediente.clienteNombre}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {expediente.tipo === "venta_directa"
                ? "Venta Directa"
                : expediente.tipo === "proyecto"
                  ? "Proyecto"
                  : "Servicio"}
              {" · "}
              {expediente.sector === "gobierno" ? "Gobierno" : "Privado"}
            </p>
          </div>
          <div className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition group-hover:bg-ylika-teal-soft group-hover:text-ylika-teal">
            <ArrowUpRight className="size-4" />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Monto</p>
            <p className="mt-0.5 text-lg font-semibold tracking-tight">
              {formatCurrency(expediente.valor)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Rentabilidad</p>
            <p
              className={cn(
                "mt-0.5 inline-flex items-center gap-1 text-lg font-semibold tracking-tight",
                expediente.rentabilidad >= 20
                  ? "text-ylika-success"
                  : "text-ylika-orange",
              )}
            >
              <TrendingUp className="size-3.5" />
              {formatPercent(expediente.rentabilidad)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/70 pt-4">
          <StatusPill estado={expediente.estado} />
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-ylika-teal"
                style={{ width: `${expediente.avance}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {expediente.avance}%
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
