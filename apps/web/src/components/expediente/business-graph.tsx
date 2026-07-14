"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import type { GraphEdge, GraphNode } from "@ylika/shared";
import { formatCurrency } from "@ylika/shared";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const estadoBar: Record<GraphNode["estado"], string> = {
  completado: "bg-ylika-success",
  activo: "bg-ylika-teal",
  pendiente: "bg-slate-300",
  riesgo: "bg-ylika-orange",
};

export function BusinessGraph({
  nodes,
  edges,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const nodeMap = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n])),
    [nodes],
  );

  const width = Math.max(...nodes.map((n) => n.x), 400) + 220;
  const height = Math.max(...nodes.map((n) => n.y), 200) + 140;

  return (
    <div className="relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-white">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Business Graph
          </h2>
          <p className="text-xs text-muted-foreground">
            Haz clic en cualquier nodo para navegar
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
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  opacity={0.7}
                />
                <circle cx={x2} cy={y2} r={3} fill="#64748b" />
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
                onClick={() => setSelected(node)}
                className={cn(
                  "w-[190px] overflow-hidden rounded-xl border bg-white text-left shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.1)]",
                  selected?.id === node.id
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
                        <p className="mt-1 text-[11px] font-medium text-amber-700">
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

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-4 left-4 right-4 rounded-xl border border-border bg-white/95 p-4 shadow-lg backdrop-blur"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {selected.tipo}
                </p>
                <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
                  {selected.titulo}
                </p>
                {selected.subtitulo && (
                  <p className="text-sm text-muted-foreground">
                    {selected.subtitulo}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSelected(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
