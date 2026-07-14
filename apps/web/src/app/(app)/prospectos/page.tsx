import { prospectos } from "@/data/seed";
import { formatCurrency, formatPercent } from "@ylika/shared";
import { cn } from "@/lib/utils";

const etapaStyle: Record<string, string> = {
  nuevo: "bg-slate-100 text-slate-700",
  calificado: "bg-sky-50 text-sky-700",
  propuesta: "bg-violet-50 text-violet-700",
  negociacion: "bg-ylika-orange-soft text-amber-700",
  ganado: "bg-ylika-success-soft text-ylika-success",
  perdido: "bg-red-50 text-red-600",
};

export default function ProspectosPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-ylika-teal uppercase">
          Prospectos
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Embudo comercial
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Los prospectos alimentan clientes y, eventualmente, expedientes de
          negocio.
        </p>
      </div>

      <div className="grid gap-3">
        {prospectos.map((p) => (
          <article
            key={p.id}
            className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
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
            <div className="flex flex-wrap items-center gap-4 sm:justify-end">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Valor estimado</p>
                <p className="font-semibold">{formatCurrency(p.valorEstimado)}</p>
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
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
