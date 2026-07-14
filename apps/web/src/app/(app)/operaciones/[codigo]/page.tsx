import { expedientes } from "@/data/seed";
import { ExpedientePageClient } from "./expediente-page-client";

export function generateStaticParams() {
  return expedientes.map((e) => ({ codigo: e.codigo }));
}

export default async function ExpedientePage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  return <ExpedientePageClient codigo={codigo} />;
}
