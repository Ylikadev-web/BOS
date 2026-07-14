import { expedientes } from "@/data/seed";
import LegacyExpedienteRedirect from "./expediente-page-client";

export function generateStaticParams() {
  return expedientes.map((e) => ({ codigo: e.codigo }));
}

export default function ExpedientePage() {
  return <LegacyExpedienteRedirect />;
}
