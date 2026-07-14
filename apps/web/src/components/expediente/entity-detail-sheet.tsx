"use client";

import { formatCurrency } from "@ylika/shared";
import type { EntityDetail } from "@/data/entity-details";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function EntityDetailSheet({
  open,
  onOpenChange,
  detail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: EntityDetail | null;
}) {
  if (!detail) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {detail.tipo}
            </Badge>
            {detail.estado && (
              <Badge className="bg-ylika-teal-soft text-ylika-teal hover:bg-ylika-teal-soft">
                {detail.estado}
              </Badge>
            )}
          </div>
          <SheetTitle className="font-[family-name:var(--font-display)] text-2xl">
            {detail.titulo}
          </SheetTitle>
          <SheetDescription>{detail.resumen}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-1">
          {(detail.codigo || detail.monto != null || detail.fecha) && (
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/80 bg-secondary/40 p-4 text-sm">
              {detail.codigo && (
                <div>
                  <p className="text-xs text-muted-foreground">Código</p>
                  <p className="font-mono font-medium">{detail.codigo}</p>
                </div>
              )}
              {detail.fecha && (
                <div>
                  <p className="text-xs text-muted-foreground">Fecha</p>
                  <p className="font-medium">{detail.fecha}</p>
                </div>
              )}
              {detail.monto != null && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Monto</p>
                  <p className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-ylika-teal">
                    {formatCurrency(detail.monto)}
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Datos
            </h3>
            <dl className="space-y-2 text-sm">
              {detail.campos.map((c) => (
                <div
                  key={c.label}
                  className="flex items-start justify-between gap-4 border-b border-border/50 pb-2"
                >
                  <dt className="text-muted-foreground">{c.label}</dt>
                  <dd className="text-right font-medium">{c.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {detail.lineas && detail.lineas.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Partidas
              </h3>
              <div className="overflow-hidden rounded-xl border border-border/80">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/60 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Concepto</th>
                      <th className="px-3 py-2 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.lineas.map((l) => (
                      <tr key={l.concepto} className="border-t border-border/60">
                        <td className="px-3 py-2.5">
                          <p className="font-medium">{l.concepto}</p>
                          <p className="text-xs text-muted-foreground">
                            {l.cantidad} × {formatCurrency(l.precio)}
                          </p>
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                          {formatCurrency(l.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {detail.relaciones && detail.relaciones.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Relaciones
              </h3>
              <div className="flex flex-wrap gap-2">
                {detail.relaciones.map((r) => (
                  <span
                    key={r.label}
                    className="rounded-lg border border-border/80 bg-card px-3 py-1.5 text-xs"
                  >
                    <span className="text-muted-foreground">{r.label}: </span>
                    <span className="font-medium">{r.value}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {detail.acciones && (
            <div className="flex flex-wrap gap-2">
              {detail.acciones.map((a) => (
                <Button
                  key={a}
                  variant={a === detail.acciones?.[0] ? "default" : "outline"}
                  size="sm"
                  className={
                    a === detail.acciones?.[0]
                      ? "bg-ylika-teal hover:bg-ylika-teal/90"
                      : undefined
                  }
                  onClick={() => onOpenChange(false)}
                >
                  {a}
                </Button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
