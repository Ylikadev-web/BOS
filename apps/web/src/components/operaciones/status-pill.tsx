import type { ExpedienteEstado } from "@ylika/shared";
import { cn } from "@/lib/utils";

const labels: Record<ExpedienteEstado, string> = {
  prospecto: "Prospecto",
  cotizacion: "Cotización",
  contrato: "Contrato",
  ejecucion: "En Ejecución",
  cobranza: "Cobranza",
  cerrado: "Cerrado",
  riesgo: "Riesgo",
};

const styles: Record<ExpedienteEstado, string> = {
  prospecto: "bg-slate-100 text-slate-700",
  cotizacion: "bg-sky-50 text-sky-700",
  contrato: "bg-indigo-50 text-indigo-700",
  ejecucion: "bg-ylika-success-soft text-ylika-success",
  cobranza: "bg-ylika-teal-soft text-ylika-teal",
  cerrado: "bg-slate-100 text-slate-500",
  riesgo: "bg-ylika-orange-soft text-amber-700",
};

export function StatusPill({
  estado,
  className,
}: {
  estado: ExpedienteEstado;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        styles[estado],
        className,
      )}
    >
      {labels[estado]}
    </span>
  );
}
