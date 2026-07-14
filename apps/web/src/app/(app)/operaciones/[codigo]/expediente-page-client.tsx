"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { expedienteHref } from "@/lib/routes";

/** Legacy /operaciones/EXP-xxx → /operaciones/ver?codigo= (GitHub Pages safe) */
export default function LegacyExpedienteRedirect() {
  const params = useParams<{ codigo: string }>();
  const router = useRouter();

  useEffect(() => {
    if (params.codigo) {
      router.replace(expedienteHref(params.codigo));
    }
  }, [params.codigo, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Abriendo expediente…
    </div>
  );
}
