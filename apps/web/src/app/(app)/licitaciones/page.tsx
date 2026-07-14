"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Download,
  ExternalLink,
  FileText,
  Filter,
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
  LICITACION_CATEGORIES,
  LICITACION_FUENTES,
  licitacionesSeed,
  type LicitacionCategoria,
  type LicitacionItem,
} from "@/data/licitaciones";

export default function LicitacionesPage() {
  const [categoria, setCategoria] = useState<LicitacionCategoria | "todas">(
    "todas",
  );
  const [q, setQ] = useState("");
  const [soloLicitacion, setSoloLicitacion] = useState(false);

  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    return licitacionesSeed.filter((item) => {
      if (categoria !== "todas" && item.categoria !== categoria) return false;
      if (
        soloLicitacion &&
        !/licitaci[oó]n\s+p[uú]blica/i.test(item.tipoProcedimiento)
      ) {
        return false;
      }
      if (!query) return true;
      const hay = [
        item.titulo,
        item.institucion,
        item.codigo,
        item.referencia,
        item.entidad,
        item.tipoProcedimiento,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [categoria, q, soloLicitacion]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { todas: licitacionesSeed.length };
    for (const c of LICITACION_CATEGORIES) {
      if (c.id === "todas") continue;
      map[c.id] = licitacionesSeed.filter((i) => i.categoria === c.id).length;
    }
    return map;
  }, []);

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
            Contrataciones públicas
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Procedimientos reales de Compras MX (datos abiertos), agrupados por
            categoría, con enlace directo al expediente público oficial.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <a
            href="https://comprasmx.buengobierno.gob.mx/sitiopublico/#/"
            target="_blank"
            rel="noreferrer"
          >
            <Landmark className="size-4" />
            Abrir Compras MX
            <ExternalLink className="size-3.5 opacity-70" />
          </a>
        </Button>
      </div>

      <div className="flex gap-3 rounded-2xl border border-ylika-teal/25 bg-ylika-teal-soft/40 p-4 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-ylika-teal" />
        <div className="space-y-1 text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Sobre los PDF:</span>{" "}
            Compras MX no publica URLs permanentes de PDF sin pasar por su
            portal (API con captcha). Lo que sí podemos darte es el{" "}
            <span className="font-medium text-foreground">
              link directo al expediente público
            </span>{" "}
            — ahí ves y descargas convocatoria, anexos y actas.
          </p>
          <p>
            Los CSV de datos abiertos sí son descarga directa (abajo).
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título, dependencia, código…"
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant={soloLicitacion ? "default" : "outline"}
          className={cn(
            "gap-2",
            soloLicitacion && "bg-ylika-teal hover:bg-ylika-teal/90",
          )}
          onClick={() => setSoloLicitacion((v) => !v)}
        >
          <Filter className="size-4" />
          Solo licitación pública
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {LICITACION_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategoria(c.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition",
              categoria === c.id
                ? "border-ylika-teal bg-ylika-teal-soft text-ylika-teal font-medium"
                : "border-border/80 text-muted-foreground hover:bg-secondary",
            )}
          >
            {c.label}
            <span className="ml-1.5 tabular-nums opacity-70">
              {counts[c.id] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {items.length === 0 && (
          <p className="rounded-2xl border border-border/80 bg-card p-6 text-sm text-muted-foreground">
            No hay procedimientos con ese filtro.
          </p>
        )}
        {items.map((item) => (
          <LicitacionRow key={item.id} item={item} onCopy={copy} />
        ))}
      </div>

      <section className="space-y-3 pt-4">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
          Fuentes y descargas oficiales
        </h2>
        <p className="text-sm text-muted-foreground">
          Portales y datasets a los que YLIKA pudo acceder públicamente.
        </p>
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
                  {f.tipo === "dataset" ? (
                    <Download className="size-4" />
                  ) : (
                    <Landmark className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium group-hover:text-ylika-teal">
                    {f.nombre}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {f.descripcion}
                  </p>
                  {f.formato && (
                    <Badge variant="secondary" className="mt-2 uppercase">
                      {f.formato}
                    </Badge>
                  )}
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
  return (
    <article className="rounded-2xl border border-border/80 bg-card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="capitalize bg-ylika-teal-soft text-ylika-teal hover:bg-ylika-teal-soft"
            >
              {item.categoria}
            </Badge>
            <Badge variant="outline" className="font-normal">
              {item.tipoProcedimiento || item.tipoContratacion}
            </Badge>
            {item.caracter && (
              <Badge variant="outline" className="font-normal">
                {item.caracter}
              </Badge>
            )}
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
            {item.titulo}
          </h2>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Building2 className="size-3.5" />
              {item.institucion || "Institución no especificada"}
            </span>
            {item.entidad && <span>· {item.entidad}</span>}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {item.codigo}
            {item.referencia ? ` · ${item.referencia}` : ""}
            {item.fechaPublicacion
              ? ` · Pub. ${item.fechaPublicacion.slice(0, 10)}`
              : ""}
          </p>
          {item.uc && (
            <p className="text-xs text-muted-foreground">UC: {item.uc}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-stretch">
          <Button asChild className="gap-2 bg-ylika-teal hover:bg-ylika-teal/90">
            <a href={item.urlPortal} target="_blank" rel="noreferrer">
              <FileText className="size-4" />
              Ver / descargar PDFs
              <ExternalLink className="size-3.5 opacity-80" />
            </a>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => onCopy(item.urlPortal)}
          >
            <Link2 className="size-4" />
            Copiar enlace
          </Button>
        </div>
      </div>
    </article>
  );
}
