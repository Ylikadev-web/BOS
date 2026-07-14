import { expedientes } from "@/data/seed";
import { ExpedienteCard } from "@/components/operaciones/expediente-card";

export default function OperacionesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-ylika-teal uppercase">
          Operaciones
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Portafolio de Operaciones
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Cada expediente es una tarjeta viva: cliente, tipo, monto, estado y
          rentabilidad — sin tablas ERP.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {expedientes.map((exp, i) => (
          <ExpedienteCard key={exp.id} expediente={exp} index={i} />
        ))}
      </div>
    </div>
  );
}
