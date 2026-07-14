import { notFound } from "next/navigation";
import { expedientes, getExpedienteByCodigo } from "@/data/seed";
import { ExpedienteWorkspace } from "@/components/expediente/expediente-workspace";

export function generateStaticParams() {
  return expedientes.map((e) => ({ codigo: e.codigo }));
}

export default async function ExpedientePage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const expediente = getExpedienteByCodigo(codigo);
  if (!expediente) notFound();

  return <ExpedienteWorkspace expediente={expediente} />;
}
