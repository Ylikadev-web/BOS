import type { LicitacionItem, LicitacionCategoria, LicitacionFuente } from "./licitaciones-types";
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
    description: "Portafolio completo de procedimientos públicos",
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

/** Portales y descargas oficiales a los que sí tenemos acceso público. */
export const LICITACION_FUENTES: LicitacionFuente[] = [
  {
    id: "compras-mx-portal",
    nombre: "Compras MX · Difusión pública",
    descripcion:
      "Procedimientos vigentes. Ahí están las convocatorias y PDFs del expediente (visor oficial).",
    url: "https://comprasmx.buengobierno.gob.mx/sitiopublico/#/",
    tipo: "portal",
  },
  {
    id: "compras-mx-datos",
    nombre: "Compras MX · Datos abiertos",
    descripcion: "Catálogo de datasets federales de contratación.",
    url: "https://comprasmx.buengobierno.gob.mx/datos-abiertos",
    tipo: "portal",
  },
  {
    id: "exp-2024-csv",
    nombre: "Expedientes PI CompraNet 2024 (CSV)",
    descripcion:
      "Descarga directa (~105 MB). Incluye título, UC, tipo y URL pública de cada anuncio.",
    url: "https://upcp-compranet.buengobierno.gob.mx/cnetassets/datos_abiertos_contratos_expedientes/Expedientes_PICompraNet2024.csv",
    tipo: "dataset",
    formato: "csv",
  },
  {
    id: "contratos-2025-csv",
    nombre: "Contratos CompraNet 2025 (CSV)",
    descripcion: "Descarga directa de contratos reportados en 2025.",
    url: "https://upcp-compranet.buengobierno.gob.mx/cnetassets/datos_abiertos_contratos_expedientes/Contratos_CompraNet2025.csv",
    tipo: "dataset",
    formato: "csv",
  },
  {
    id: "contratos-2024-csv",
    nombre: "Contratos CompraNet 2024 (CSV)",
    descripcion: "Dataset abierto de contratos 2024.",
    url: "https://upcp-compranet.buengobierno.gob.mx/cnetassets/datos_abiertos_contratos_expedientes/Contratos_CompraNet2024.csv",
    tipo: "dataset",
    formato: "csv",
  },
  {
    id: "exp-2023-csv",
    nombre: "Expedientes PI CompraNet 2023 (CSV)",
    descripcion: "Histórico de expedientes 2023.",
    url: "https://upcp-compranet.buengobierno.gob.mx/cnetassets/datos_abiertos_contratos_expedientes/Expedientes_PICompraNet2023.csv",
    tipo: "dataset",
    formato: "csv",
  },
  {
    id: "historico",
    nombre: "CompraNet histórico 5.0",
    descripcion: "Consulta pública de procedimientos 2010–2022.",
    url: "https://historico-compranet.buengobierno.gob.mx/",
    tipo: "portal",
  },
];

export const licitacionesSeed = sample as LicitacionItem[];

export function groupLicitaciones(items: LicitacionItem[]) {
  const map = new Map<LicitacionCategoria, LicitacionItem[]>();
  for (const item of items) {
    const list = map.get(item.categoria) ?? [];
    list.push(item);
    map.set(item.categoria, list);
  }
  return map;
}
