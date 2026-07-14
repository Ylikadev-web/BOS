import type {
  LicitacionItem,
  LicitacionCategoria,
  LicitacionFuente,
  LicitacionRubro,
} from "./licitaciones-types";
import sample from "./licitaciones-sample.json";

export type {
  LicitacionItem,
  LicitacionCategoria,
  LicitacionFuente,
  LicitacionDocumento,
  LicitacionRubro,
} from "./licitaciones-types";

export const LICITACION_CATEGORIES: {
  id: LicitacionCategoria | "todas";
  label: string;
  description: string;
}[] = [
  {
    id: "todas",
    label: "Todas",
    description: "Adquisiciones y suministro aún sin apertura",
  },
  {
    id: "adquisiciones",
    label: "Adquisiciones",
    description: "Bienes, materiales y equipo",
  },
  {
    id: "servicios",
    label: "Servicios",
    description: "Servicios (poco relevantes para integradoras)",
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

export const LICITACION_RUBROS: {
  id: LicitacionRubro | "todos";
  label: string;
}[] = [
  { id: "todos", label: "Todos los rubros" },
  { id: "medico", label: "Médico / laboratorio" },
  { id: "tecnologia", label: "Equipamiento / tecnología" },
  { id: "materiales", label: "Materiales / útiles" },
  { id: "insumos_industriales", label: "Insumos industriales" },
  { id: "infraestructura", label: "Infraestructura" },
  { id: "mobiliario", label: "Mobiliario" },
  { id: "vehicular", label: "Vehicular" },
  { id: "agro", label: "Agro / rural" },
  { id: "vestuario", label: "Vestuario" },
  { id: "suministros", label: "Otros suministros" },
];

/** Portales con convocatorias descargables (PDF/DOC/ZIP). */
export const LICITACION_FUENTES: LicitacionFuente[] = [
  {
    id: "puebla",
    nombre: "Licitaciones Puebla · Adquisiciones",
    descripcion: "Bases vigentes en PDF del Gobierno del Estado de Puebla.",
    url: "https://licitaciones.puebla.gob.mx/index.php/aquisiciones-bienes-y-servicios/convocatorias-aquisiciones-bienes-y-servicios",
    tipo: "portal",
  },
  {
    id: "cdmx-concurso",
    nombre: "Concurso Digital CDMX",
    descripcion: "Convocatorias abiertas con bases y anexo técnico en PDF.",
    url: "https://concursodigital.finanzas.cdmx.gob.mx/convocatorias_publicas",
    tipo: "portal",
  },
  {
    id: "sinaloa-salud",
    nombre: "CompraNet Sinaloa · Salud",
    descripcion: "Adquisiciones de Servicios de Salud de Sinaloa.",
    url: "https://compranet.sinaloa.gob.mx/servicios-de-salud-de-sinaloa-sss-adquisiciones",
    tipo: "portal",
  },
  {
    id: "compras-mx-portal",
    nombre: "Compras MX · Difusión pública",
    descripcion:
      "Portal federal. Los PDF del expediente suelen requerir captcha.",
    url: "https://comprasmx.buengobierno.gob.mx/sitiopublico/#/",
    tipo: "portal",
  },
];

export const licitacionesSeed = sample as LicitacionItem[];

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

/** Apertura de proposiciones aún no ocurrida (hoy o futura). */
export function isLicitacionNoIniciada(
  item: LicitacionItem,
  now: Date = startOfToday(),
): boolean {
  const apertura = parseIsoDate(item.fechaApertura);
  if (!apertura) return false;
  return apertura.getTime() >= now.getTime();
}

const MANTENIMIENTO_RE =
  /\bmantenimiento\b|\blimpieza\b|\bvigilancia\b|\blavander/i;

/** Perfil integradora: compra/suministro de bienes, no servicios de mantenimiento. */
export function isLicitacionSuministro(item: LicitacionItem): boolean {
  if (item.categoria === "adquisiciones") return true;
  if (item.tipoContratacion?.toUpperCase().includes("ADQUISIC")) return true;
  const blob = `${item.titulo} ${item.tipoProcedimiento}`;
  if (MANTENIMIENTO_RE.test(blob) && !/adquisici[oó]n/i.test(blob)) {
    return false;
  }
  return /adquisici[oó]n|suministro|material|equipo|insumo|mobiliario/i.test(
    blob,
  );
}

export function licitacionesNoIniciadas(
  items: LicitacionItem[] = licitacionesSeed,
  now: Date = startOfToday(),
): LicitacionItem[] {
  return items
    .filter((item) => isLicitacionNoIniciada(item, now))
    .filter(isLicitacionSuministro)
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
