"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import type { GraphEdge, GraphNode } from "@ylika/shared";
import { formatCurrency } from "@ylika/shared";
import { cn } from "@/lib/utils";
import { resolveEntityDetail, type EntityDetail } from "@/data/entity-details";
import { EntityDetailSheet } from "@/components/expediente/entity-detail-sheet";

const estadoBar: Record<GraphNode["estado"], string> = {
  completado: "bg-ylika-success",
  activo: "bg-ylika-teal",
  pendiente: "bg-slate-300 dark:bg-slate-600",
  riesgo: "bg-ylika-orange",
};

export function BusinessGraph({
  nodes,
  edges,
  expedienteCodigo,
  clienteNombre,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  expedienteCodigo: string;
  clienteNombre: string;
}) {
  const [detail, setDetail] = useState<EntityDetail | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const nodeMap = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n])),
    [nodes],
  );

  const width = Math.max(...nodes.map((n) => n.x), 400) + 220;
  const height = Math.max(...nodes.map((n) => n.y), 200) + 140;

  const openNode = (node: GraphNode) => {
    setSelectedId(node.id);
    setDetail(
      resolveEntityDetail({
        tipo: node.tipo,
        titulo: node.titulo,
        subtitulo: node.subtitulo,
        monto: node.monto,
        expedienteCodigo,
        clienteNombre,
      }),
    );
    setOpen(true);
  };

  return (
    <>
      <div className="relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card">
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Business Graph
            </h2>
            <p className="text-xs text-muted-foreground">
              Haz clic en cualquier nodo para ver el detalle
            </p>
          </div>
        </div>

        <div className="graph-canvas relative flex-1 overflow-auto">
          <svg
            width={width}
            height={height}
            className="min-w-full"
            role="img"
            aria-label="Business Graph"
          >
            {edges.map((edge) => {
              const from = nodeMap[edge.from];
              const to = nodeMap[edge.to];
              if (!from || !to) return null;
              const x1 = from.x + 100;
              const y1 = from.y + 48;
              const x2 = to.x + 100;
              const y2 = to.y + 8;
              const midY = (y1 + y2) / 2;
              return (
                <g key={edge.id}>
                  <path
                    d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                    fill="none"
                    stroke="currentColor"
                    className="text-slate-400/70 dark:text-slate-500"
                    strokeWidth={1.5}
                  />
                  <circle
                    cx={x2}
                    cy={y2}
                    r={3}
                    className="fill-slate-500 dark:fill-slate-400"
                  />
                </g>
              );
            })}

            {nodes.map((node, i) => (
              <foreignObject
                key={node.id}
                x={node.x}
                y={node.y}
                width={200}
                height={node.tipo === "alerta" ? 96 : 88}
              >
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.04 * i, duration: 0.35 }}
                  onClick={() => openNode(node)}
                  className={cn(
                    "w-[190px] overflow-hidden rounded-xl border bg-card text-left shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.12)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)]",
                    selectedId === node.id
                      ? "border-ylika-teal ring-2 ring-ylika-teal/20"
                      : "border-border/80",
                    node.tipo === "alerta" && "border-ylika-orange/40",
                  )}
                >
                  <div className={cn("h-1.5 w-full", estadoBar[node.estado])} />
                  <div className="px-3 py-2.5">
                    <div className="flex items-start gap-2">
                      {node.tipo === "alerta" && (
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-ylika-orange" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold tracking-tight">
                          {node.titulo}
                        </p>
                        {node.subtitulo && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {node.subtitulo}
                          </p>
                        )}
                        {node.monto != null && !node.subtitulo?.includes("$") && (
                          <p className="mt-1 text-xs font-medium">
                            {formatCurrency(node.monto)}
                          </p>
                        )}
                        {node.tipo === "alerta" && (
                          <p className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                            ⚠ Riesgo de Retraso
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              </foreignObject>
            ))}
          </svg>
        </div>
      </div>

      <EntityDetailSheet
        open={open}
        onOpenChange={setOpen}
        detail={detail}
      />
    </>
  );
}
