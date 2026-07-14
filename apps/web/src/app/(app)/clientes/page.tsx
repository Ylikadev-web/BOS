import Link from "next/link";
import { clientes, expedientes } from "@/data/seed";
import { formatCurrency } from "@ylika/shared";
import { cn } from "@/lib/utils";

export default function ClientesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-ylika-teal uppercase">
          Clientes
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Relaciones activas
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Cada cliente concentra contactos, crédito y sus expedientes de
          negocio.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {clientes.map((c) => {
          const exps = expedientes.filter((e) => e.clienteId === c.id);
          return (
            <article
              key={c.id}
              className="rounded-2xl border border-border/80 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {c.codigo}
                  </p>
                  <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold">
                    {c.nombre}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {c.industria} · {c.rfc}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                    c.estado === "activo" &&
                      "bg-ylika-success-soft text-ylika-success",
                    c.estado === "riesgo" &&
                      "bg-ylika-orange-soft text-amber-700",
                    c.estado === "inactivo" && "bg-slate-100 text-slate-500",
                  )}
                >
                  {c.estado}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Cartera</p>
                  <p className="font-semibold">
                    {formatCurrency(c.valorCartera)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Crédito</p>
                  <p className="font-semibold">
                    {formatCurrency(c.creditoDisponible)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expedientes</p>
                  <p className="font-semibold">{c.expedientesActivos}</p>
                </div>
              </div>

              {exps.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border/70 pt-4">
                  {exps.map((e) => (
                    <Link
                      key={e.id}
                      href={`/operaciones/${e.codigo}`}
                      className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-ylika-teal-soft hover:text-ylika-teal"
                    >
                      {e.codigo}
                    </Link>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
