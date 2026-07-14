import type {
  LicitacionItem,
  LicitacionCategoria,
  LicitacionFuente,
} from "./licitaciones-types";
import sample from "./licitaciones-sample.json";

export type {
  LicitacionItem,
  LicitacionCategoria,
  LicitacionFuente,
  LicitacionDocumento,
} from "./licitaciones-types";

export const LICITACION_CATEGORIES: {
  id: LicitacionCategoria | "todas";
  label: string;
  description: string;
}[] = [
  {
    id: "todas",
    label: "Todas",
    description: "Procedimientos aún no iniciados",
  },
  {
    id: "adquisiciones",
    label: "Adquisiciones",
    description: "Bienes y suministros",
  },
  {
    id: "servicios",
    label: "Servicios",
    description: "Servicios al sector público",
  },
  {
    id: "obras",
    label: "Obras públicas",
    description: "Obra y servicios relacionados",
  },
  {
    id: "arrendamientos",
    label: "Arrendamientos",
    description: "Arrendamiento de bienes",
  },
  {
    id: "otros",
    label: "Otros",
    description: "Otros tipos de contratación",
  },
];

/** Portales oficiales donde se publican convocatorias con PDF. */
export const LICITACION_FUENTES: LicitacionFuente[] = [
  {
    id: "compras-mx-portal",
    nombre: "Compras MX · Difusión pública",
    descripcion:
      "Portal federal. Los PDF del expediente suelen requerir captcha; priorizamos PDFs institucionales directos.",
    url: "https://comprasmx.buengobierno.gob.mx/sitiopublico/#/",
    tipo: "portal",
  },
  {
    id: "ine-licitaciones",
    nombre: "INE · Licitaciones presenciales",
    descripcion: "Convocatorias oficiales en PDF del Instituto Nacional Electoral.",
    url: "https://www.ine.mx/licitaciones-contrataciones-presenciales/",
    tipo: "portal",
  },
  {
    id: "iner",
    nombre: "INER · Convocatorias",
    descripcion:
      "Instituto Nacional de Enfermedades Respiratorias — PDFs de convocatoria públicos.",
    url: "http://iner.salud.gob.mx/",
    tipo: "portal",
  },
  {
    id: "compras-mx-datos",
    nombre: "Compras MX · Datos abiertos",
    descripcion:
      "CSV federales (histórico). No incluyen PDF ni suelen cubrir procedimientos futuros.",
    url: "https://comprasmx.buengobierno.gob.mx/datos-abiertos",
    tipo: "portal",
  },
];

export const licitacionesSeed = sample as LicitacionItem[];

/** Inicio del día local — apertura posterior = aún no inicia. */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function parseIsoDate(iso: string): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Procedimiento cuya apertura de proposiciones aún no ocurre. */
export function isLicitacionNoIniciada(
  item: LicitacionItem,
  now: Date = startOfToday(),
): boolean {
  const apertura = parseIsoDate(item.fechaApertura);
  if (!apertura) return false;
  return apertura.getTime() > now.getTime();
}

export function licitacionesNoIniciadas(
  items: LicitacionItem[] = licitacionesSeed,
  now: Date = startOfToday(),
): LicitacionItem[] {
  return items
    .filter((item) => isLicitacionNoIniciada(item, now))
    .sort((a, b) => a.fechaApertura.localeCompare(b.fechaApertura));
}

export function formatFechaCorta(iso?: string): string {
  const d = iso ? parseIsoDate(iso) : null;
  if (!d) return "—";
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function groupLicitaciones(items: LicitacionItem[]) {
  const map = new Map<LicitacionCategoria, LicitacionItem[]>();
  for (const item of items) {
    const list = map.get(item.categoria) ?? [];
    list.push(item);
    map.set(item.categoria, list);
  }
  return map;
}
