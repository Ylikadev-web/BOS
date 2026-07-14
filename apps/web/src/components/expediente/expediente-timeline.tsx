"use client";

import { motion } from "framer-motion";
import { Check, Circle, AlertTriangle } from "lucide-react";
import type { TimelineEvent } from "@ylika/shared";
import { formatCurrency } from "@ylika/shared";
import { cn } from "@/lib/utils";

export function ExpedienteTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-4">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Timeline
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Historia viva del negocio
        </p>
      </div>

      <ol className="relative flex-1 space-y-0 pl-1">
        {events.map((event, index) => {
          const isLast = index === events.length - 1;
          return (
            <motion.li
              key={event.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index, duration: 0.3 }}
              className="relative flex gap-3 pb-6"
            >
              {!isLast && (
                <span className="absolute left-[11px] top-6 h-[calc(100%-8px)] w-px bg-border" />
              )}
              <TimelineMarker estado={event.estado} />
              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className={cn(
                    "text-sm font-medium",
                    event.estado === "activo" && "text-ylika-teal",
                    event.estado === "pendiente" && "text-muted-foreground",
                    event.estado === "riesgo" && "text-amber-700",
                  )}
                >
                  {event.label}
                </p>
                {event.sublabel && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {event.sublabel}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  {event.fecha && <span>{event.fecha}</span>}
                  {event.monto != null && (
                    <span className="font-medium text-foreground/70">
                      {formatCurrency(event.monto)}
                    </span>
                  )}
                </div>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

function TimelineMarker({ estado }: { estado: TimelineEvent["estado"] }) {
  if (estado === "completado") {
    return (
      <span className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full bg-ylika-success text-white">
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (estado === "activo") {
    return (
      <span className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full bg-ylika-teal ring-4 ring-ylika-teal-soft">
        <Circle className="size-2 fill-white text-white" />
      </span>
    );
  }
  if (estado === "riesgo") {
    return (
      <span className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full bg-ylika-orange text-white">
        <AlertTriangle className="size-3.5" />
      </span>
    );
  }
  return (
    <span className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-border bg-white">
      <Circle className="size-2 text-transparent" />
    </span>
  );
}
