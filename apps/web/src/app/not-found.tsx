"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function NotFound() {
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/operaciones\/(EXP-[A-Za-z0-9-]+)\/?$/i);
    if (match) {
      const base = path.includes("/BOS/") ? "/BOS" : "";
      window.location.replace(
        `${base}/operaciones/ver/?codigo=${encodeURIComponent(match[1])}`,
      );
    }
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="font-[family-name:var(--font-display)] text-2xl font-semibold">
        Página no encontrada
      </p>
      <p className="text-sm text-muted-foreground">
        Si creaste un expediente nuevo, te redirigimos automáticamente…
      </p>
      <Link href="/workspace" className="text-sm font-medium text-ylika-teal hover:underline">
        Volver al workspace
      </Link>
    </div>
  );
}
