import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Sparkles, Users } from "lucide-react";
import { expedientes } from "@/data/seed";
import { ExpedienteCard } from "@/components/operaciones/expediente-card";
import { formatCurrency } from "@ylika/shared";

export default function WorkspacePage() {
  const activos = expedientes.filter((e) => e.estado !== "cerrado");
  const enRiesgo = expedientes.filter((e) => e.estado === "riesgo").length;
  const valorPortafolio = activos.reduce((sum, e) => sum + e.valor, 0);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-white px-6 py-8 sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(13,148,136,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(245,158,11,0.1),transparent_50%)]" />
        <div className="relative max-w-2xl">
          <p className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-[0.2em] text-ylika-teal uppercase">
            YLIKA
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight sm:text-5xl">
            Business Operating System
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground sm:text-lg">
            Toda operación vive en un expediente. Navega por prospectos,
            clientes y operaciones — no por módulos ERP.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/operaciones"
              className="inline-flex items-center gap-2 rounded-xl bg-ylika-teal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ylika-teal/90"
            >
              Portafolio de Operaciones
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/operaciones/EXP-000875"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-secondary"
            >
              Abrir PLANTA NORTE
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric
          icon={<BriefcaseBusiness className="size-4" />}
          label="Operaciones activas"
          value={String(activos.length)}
        />
        <Metric
          icon={<Users className="size-4" />}
          label="Valor del portafolio"
          value={formatCurrency(valorPortafolio)}
        />
        <Metric
          icon={<Sparkles className="size-4" />}
          label="Con señal de riesgo"
          value={String(enRiesgo)}
        />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
              Operaciones recientes
            </h2>
            <p className="text-sm text-muted-foreground">
              Tarjetas vivas del portafolio
            </p>
          </div>
          <Link
            href="/operaciones"
            className="text-sm font-medium text-ylika-teal hover:underline"
          >
            Ver todas
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {expedientes.slice(0, 3).map((exp, i) => (
            <ExpedienteCard key={exp.id} expediente={exp} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-white p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}
