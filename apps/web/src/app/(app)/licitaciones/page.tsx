"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  Download,
  ExternalLink,
  FileText,
  Info,
  Landmark,
  Link2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  LICITACION_FUENTES,
  LICITACION_RUBROS,
  formatFechaCorta,
  licitacionesNoIniciadas,
  type LicitacionItem,
  type LicitacionRubro,
} from "@/data/licitaciones";

export default function LicitacionesPage() {
  const [rubro, setRubro] = useState<LicitacionRubro | "todos">("todos");
  const [q, setQ] = useState("");

  const upcoming = useMemo(() => licitacionesNoIniciadas(), []);

  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    return upcoming.filter((item) => {
      if (rubro !== "todos" && item.rubro !== rubro) return false;
      if (!query) return true;
      const hay = [
        item.titulo,
        item.institucion,
        item.codigo,
        item.referencia,
        item.entidad,
        item.rubro,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [rubro, q, upcoming]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { todos: upcoming.length };
    for (const r of LICITACION_RUBROS) {
      if (r.id === "todos") continue;
      map[r.id] = upcoming.filter((i) => i.rubro === r.id).length;
    }
    return map;
  }, [upcoming]);

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium tracking-wide text-ylika-teal uppercase">
            Licitaciones
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            Adquisiciones y suministro
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Orientado a integradoras: compra de materiales, equipo e insumos.
            Solo procedimientos{" "}
            <span className="font-medium text-foreground">sin apertura aún</span>{" "}
            y con{" "}
            <span className="font-medium text-foreground">
              documento oficial descargable
            </span>
            . Se excluyen mantenimiento, limpieza y vigilancia.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground tabular-nums">
            {upcoming.length}
          </span>{" "}
          vigentes
        </div>
      </div>

      <div className="flex gap-3 rounded-2xl border border-ylika-teal/25 bg-ylika-teal-soft/40 p-4 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-ylika-teal" />
        <div className="space-y-1 text-muted-foreground">
          <p>
            Fuentes actuales:{" "}
            <span className="font-medium text-foreground">Puebla</span>,{" "}
            <span className="font-medium text-foreground">CDMX</span> y{" "}
            <span className="font-medium text-foreground">Sinaloa (Salud)</span>{" "}
            — portales que publican bases en PDF/DOC/ZIP sin captcha. Compras MX
            federal sigue bloqueando PDFs permanentes.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar material, equipo, dependencia, código…"
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {LICITACION_RUBROS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRubro(r.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition",
              rubro === r.id
                ? "border-ylika-teal bg-ylika-teal-soft text-ylika-teal font-medium"
                : "border-border/80 text-muted-foreground hover:bg-secondary",
            )}
          >
            {r.label}
            <span className="ml-1.5 tabular-nums opacity-70">
              {counts[r.id] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {items.length === 0 && (
          <p className="rounded-2xl border border-border/80 bg-card p-6 text-sm text-muted-foreground">
            No hay adquisiciones sin iniciar con ese filtro.
          </p>
        )}
        {items.map((item) => (
          <LicitacionRow key={item.id} item={item} onCopy={copy} />
        ))}
      </div>

      <section className="space-y-3 pt-4">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
          Fuentes oficiales
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {LICITACION_FUENTES.map((f) => (
            <a
              key={f.id}
              href={f.url}
              target="_blank"
              rel="noreferrer"
              className="group rounded-2xl border border-border/80 bg-card p-4 transition hover:border-ylika-teal/40"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-secondary text-ylika-teal">
                  <Landmark className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium group-hover:text-ylika-teal">
                    {f.nombre}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {f.descripcion}
                  </p>
                </div>
                <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function LicitacionRow({
  item,
  onCopy,
}: {
  item: LicitacionItem;
  onCopy: (url: string) => void;
}) {
  const doc =
    item.documentos.find((d) => d.tipo === "convocatoria")?.url ??
    item.urlDocumentoOficial;
  const fmt =
    item.documentos.find((d) => d.tipo === "convocatoria")?.formato ?? "pdf";
  const portal = item.urlPortal;
  const rubroLabel =
    LICITACION_RUBROS.find((r) => r.id === item.rubro)?.label ?? item.rubro;

  return (
    <article className="rounded-2xl border border-border/80 bg-card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
              Sin iniciar apertura
            </Badge>
            {rubroLabel && (
              <Badge
                variant="secondary"
                className="bg-ylika-teal-soft text-ylika-teal hover:bg-ylika-teal-soft"
              >
                {rubroLabel}
              </Badge>
            )}
            <Badge variant="outline" className="font-normal">
              {item.tipoProcedimiento}
            </Badge>
            {item.entidad && (
              <Badge variant="outline" className="font-normal">
                {item.entidad}
              </Badge>
            )}
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
            {item.titulo}
          </h2>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Building2 className="size-3.5" />
              {item.institucion}
            </span>
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {item.codigo}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5" />
              Pub. {formatFechaCorta(item.fechaPublicacion)}
            </span>
            {item.fechaJunta && (
              <span>Junta {formatFechaCorta(item.fechaJunta)}</span>
            )}
            <span className="font-medium text-foreground">
              Apertura {formatFechaCorta(item.fechaApertura)}
            </span>
            {item.fechaFallo && (
              <span>Fallo est. {formatFechaCorta(item.fechaFallo)}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{item.fuente}</p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-stretch">
          <Button asChild className="gap-2 bg-ylika-teal hover:bg-ylika-teal/90">
            <a href={doc} target="_blank" rel="noreferrer">
              <FileText className="size-4" />
              Documento oficial ({fmt.toUpperCase()})
              <Download className="size-3.5 opacity-80" />
            </a>
          </Button>
          {portal && (
            <Button asChild variant="outline" className="gap-2">
              <a href={portal} target="_blank" rel="noreferrer">
                <Landmark className="size-4" />
                Portal
                <ExternalLink className="size-3.5 opacity-70" />
              </a>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => onCopy(doc)}
          >
            <Link2 className="size-4" />
            Copiar documento
          </Button>
        </div>
      </div>
    </article>
  );
}
