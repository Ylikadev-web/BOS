export type ExpedienteMatchHint = {
  codigo: string;
  nombre: string;
  clienteNombre: string;
};

export type DocumentoAiProvider =
  | "gemini"
  | "openai"
  | "anthropic"
  | "api"
  | "local"
  | "heuristic";

export interface DocumentoAiResultado {
  archivo: string;
  clasificacion: string;
  proveedor?: string;
  cliente?: string;
  monto?: number;
  concepto?: string;
  proyecto?: string;
  /** Resumen ejecutivo generado por IA */
  resumen?: string;
  fecha?: string;
  moneda?: string;
  rfcEmisor?: string;
  rfcReceptor?: string;
  /** Señales de riesgo / inconsistencias */
  riesgos?: string[];
  /** Personas, empresas, códigos detectados */
  entidadesDetectadas?: string[];
  /** 0–1 confianza de la extracción */
  confianzaExtraccion?: number;
  /** Motor que produjo el análisis */
  provider?: DocumentoAiProvider;
  model?: string;
  expedienteSugerido?: {
    codigo: string;
    nombre: string;
    confianza: number;
  };
  duplicados?: string[];
  campos: Record<string, string | number>;
}

export const DOCUMENT_ANALYSIS_MODEL = "gemini-2.5-flash";

export const DOCUMENT_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  properties: {
    clasificacion: {
      type: "string",
      description:
        "Tipo documental: Factura/CFDI, Cotización, Orden de compra, Contrato, Remisión, Correo, Otro",
    },
    resumen: {
      type: "string",
      description: "Resumen ejecutivo en 2-4 oraciones en español",
    },
    proveedor: { type: "string" },
    cliente: { type: "string" },
    monto: { type: "number" },
    moneda: { type: "string" },
    concepto: { type: "string" },
    proyecto: { type: "string" },
    fecha: { type: "string", description: "YYYY-MM-DD si es posible" },
    rfcEmisor: { type: "string" },
    rfcReceptor: { type: "string" },
    riesgos: {
      type: "array",
      items: { type: "string" },
      description: "Riesgos, faltantes o inconsistencias",
    },
    entidadesDetectadas: {
      type: "array",
      items: { type: "string" },
    },
    confianzaExtraccion: {
      type: "number",
      description: "0 a 1",
    },
    expedienteCodigoSugerido: {
      type: "string",
      description: "Código EXP-xxxxxx del catálogo si hay match, o vacío",
    },
    confianzaMatch: { type: "number" },
  },
  required: ["clasificacion", "resumen", "confianzaExtraccion"],
} as const;

export function buildDocumentAnalysisPrompt(
  filename: string,
  expedientes: ExpedienteMatchHint[],
  textExcerpt?: string,
) {
  const catalog =
    expedientes.length === 0
      ? "(sin catálogo)"
      : expedientes
          .map(
            (e) =>
              `- ${e.codigo} · ${e.nombre} · cliente ${e.clienteNombre}`,
          )
          .join("\n");

  return `Eres el motor documental de YLIKA, un Business Operating System mexicano.
Analiza el documento comercial/operativo adjunto y extrae información accionable para un expediente de negocio.

Archivo: ${filename}

Catálogo de expedientes activos (elige el mejor match o deja vacío):
${catalog}

Reglas:
- Responde SOLO JSON válido según el schema.
- Montos en número (sin símbolos). Preferir MXN.
- Si es CFDI/XML, prioriza Emisor/Receptor, Total, UUID, conceptos.
- Señala riesgos: sin RFC, montos incompletos, sin fecha, posible duplicado, CFDI cancelable, etc.
- El resumen debe ser útil para un ejecutivo comercial (qué es, de quién, para qué, monto).
- Si no estás seguro de un campo, omítelo o usa confianzaExtraccion baja.

${textExcerpt ? `Contenido textual extraído (puede ser parcial):\n---\n${textExcerpt.slice(0, 12000)}\n---` : "El contenido multimodal del archivo está adjunto."}`;
}

export function guessMimeType(filename: string, fallback = "application/octet-stream") {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".xml")) return "application/xml";
  if (lower.endsWith(".csv")) return "text/csv";
  if (lower.endsWith(".txt") || lower.endsWith(".eml")) return "text/plain";
  if (lower.endsWith(".xlsx"))
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (lower.endsWith(".xls")) return "application/vnd.ms-excel";
  return fallback;
}

export function isMultimodalDocument(mime: string, filename: string) {
  const m = mime || guessMimeType(filename);
  return (
    m.startsWith("image/") ||
    m === "application/pdf" ||
    filename.toLowerCase().endsWith(".pdf")
  );
}

type RawAiJson = {
  clasificacion?: string;
  resumen?: string;
  proveedor?: string;
  cliente?: string;
  monto?: number;
  moneda?: string;
  concepto?: string;
  proyecto?: string;
  fecha?: string;
  rfcEmisor?: string;
  rfcReceptor?: string;
  riesgos?: string[];
  entidadesDetectadas?: string[];
  confianzaExtraccion?: number;
  expedienteCodigoSugerido?: string;
  confianzaMatch?: number;
};

export function normalizeAiResult(input: {
  archivo: string;
  raw: RawAiJson;
  expedientes: ExpedienteMatchHint[];
  provider: DocumentoAiProvider;
  model?: string;
}): DocumentoAiResultado {
  const { archivo, raw, expedientes, provider, model } = input;
  const codigo = (raw.expedienteCodigoSugerido || "").trim().toUpperCase();
  const matched = expedientes.find(
    (e) => e.codigo.toUpperCase() === codigo,
  );
  const fuzzy =
    matched ??
    matchExpedienteHeuristic(
      {
        cliente: raw.cliente,
        proveedor: raw.proveedor,
        proyecto: raw.proyecto,
        concepto: raw.concepto,
        resumen: raw.resumen,
      },
      expedientes,
    );

  const campos: Record<string, string | number> = {
    Archivo: archivo,
    Clasificación: raw.clasificacion ?? "Documento",
  };
  if (raw.proveedor) campos.Proveedor = raw.proveedor;
  if (raw.cliente) campos.Cliente = raw.cliente;
  if (raw.monto != null) campos.Monto = raw.monto;
  if (raw.moneda) campos.Moneda = raw.moneda;
  if (raw.concepto) campos.Concepto = raw.concepto;
  if (raw.proyecto) campos.Proyecto = raw.proyecto;
  if (raw.fecha) campos.Fecha = raw.fecha;
  if (raw.rfcEmisor) campos["RFC emisor"] = raw.rfcEmisor;
  if (raw.rfcReceptor) campos["RFC receptor"] = raw.rfcReceptor;

  return {
    archivo,
    clasificacion: raw.clasificacion || "Documento comercial",
    resumen: raw.resumen,
    proveedor: raw.proveedor || undefined,
    cliente: raw.cliente || undefined,
    monto: typeof raw.monto === "number" ? raw.monto : undefined,
    moneda: raw.moneda || "MXN",
    concepto: raw.concepto || undefined,
    proyecto: raw.proyecto || undefined,
    fecha: raw.fecha || undefined,
    rfcEmisor: raw.rfcEmisor || undefined,
    rfcReceptor: raw.rfcReceptor || undefined,
    riesgos: raw.riesgos?.filter(Boolean) ?? [],
    entidadesDetectadas: raw.entidadesDetectadas?.filter(Boolean) ?? [],
    confianzaExtraccion: clamp01(raw.confianzaExtraccion ?? 0.6),
    provider,
    model,
    expedienteSugerido: fuzzy
      ? {
          codigo: fuzzy.codigo,
          nombre: fuzzy.nombre,
          confianza: clamp01(
            matched
              ? (raw.confianzaMatch ?? 0.85)
              : (fuzzy as { confianza?: number }).confianza ?? 0.55,
          ),
        }
      : undefined,
    duplicados: [],
    campos,
  };
}

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

export function matchExpedienteHeuristic(
  signals: {
    cliente?: string;
    proveedor?: string;
    proyecto?: string;
    concepto?: string;
    resumen?: string;
    archivo?: string;
  },
  expedientes: ExpedienteMatchHint[],
): (ExpedienteMatchHint & { confianza: number }) | undefined {
  if (!expedientes.length) return undefined;
  const haystack = [
    signals.cliente,
    signals.proveedor,
    signals.proyecto,
    signals.concepto,
    signals.resumen,
    signals.archivo,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let best: (ExpedienteMatchHint & { confianza: number }) | undefined;
  for (const e of expedientes) {
    let score = 0;
    const tokens = [
      e.codigo.toLowerCase(),
      e.nombre.toLowerCase(),
      e.clienteNombre.toLowerCase(),
      ...e.nombre.toLowerCase().split(/\s+/),
      ...e.clienteNombre.toLowerCase().split(/\s+/),
    ].filter((t) => t.length > 2);

    for (const t of tokens) {
      if (haystack.includes(t)) score += t.length > 5 ? 0.25 : 0.12;
    }
    if (score > (best?.confianza ?? 0)) {
      best = { ...e, confianza: Math.min(0.95, score) };
    }
  }
  return best && best.confianza >= 0.24 ? best : undefined;
}

/** Parser local fuerte para CFDI XML (México) cuando no hay IA. */
export function parseCfdiXml(
  xml: string,
  archivo: string,
  expedientes: ExpedienteMatchHint[],
): DocumentoAiResultado | null {
  if (!/<cfdi:Comprobante|<Comprobante/i.test(xml)) return null;

  const attr = (tag: string, name: string) => {
    const re = new RegExp(`<${tag}[^>]*\\b${name}="([^"]+)"`, "i");
    return xml.match(re)?.[1];
  };
  const total = Number(attr("(?:cfdi:)?Comprobante", "Total") || NaN);
  const fecha = attr("(?:cfdi:)?Comprobante", "Fecha")?.slice(0, 10);
  const emisor = attr("(?:cfdi:)?Emisor", "Nombre");
  const rfcEmisor = attr("(?:cfdi:)?Emisor", "Rfc");
  const receptor = attr("(?:cfdi:)?Receptor", "Nombre");
  const rfcReceptor = attr("(?:cfdi:)?Receptor", "Rfc");
  const desc =
    xml.match(/Descripcion="([^"]+)"/i)?.[1] ||
    xml.match(/Descripción="([^"]+)"/i)?.[1];

  const raw = {
    clasificacion: "Factura / CFDI",
    resumen: `CFDI de ${emisor || "emisor"} hacia ${receptor || "receptor"}${
      Number.isFinite(total) ? ` por $${total.toLocaleString("es-MX")}` : ""
    }. ${desc ? `Concepto: ${desc}.` : ""}`.trim(),
    proveedor: emisor,
    cliente: receptor,
    monto: Number.isFinite(total) ? total : undefined,
    moneda: attr("(?:cfdi:)?Comprobante", "Moneda") || "MXN",
    concepto: desc,
    fecha,
    rfcEmisor,
    rfcReceptor,
    riesgos: [
      !fecha ? "Sin fecha detectable" : "",
      !Number.isFinite(total) ? "Total no legible" : "",
    ].filter(Boolean),
    entidadesDetectadas: [emisor, receptor, rfcEmisor, rfcReceptor].filter(
      Boolean,
    ) as string[],
    confianzaExtraccion: 0.9,
  };

  return normalizeAiResult({
    archivo,
    raw,
    expedientes,
    provider: "local",
    model: "cfdi-xml-parser",
  });
}

export function heuristicAnalyze(input: {
  archivo: string;
  text?: string;
  size: number;
  expedientes: ExpedienteMatchHint[];
}): DocumentoAiResultado {
  const { archivo, text = "", size, expedientes } = input;
  const cfdi = text ? parseCfdiXml(text, archivo, expedientes) : null;
  if (cfdi) return cfdi;

  const lower = `${archivo}\n${text}`.toLowerCase();
  let clasificacion = "Documento comercial";
  if (/factura|cfdi|uuid/.test(lower)) clasificacion = "Factura / CFDI";
  else if (/cotiz|quote|propuesta/.test(lower)) clasificacion = "Cotización";
  else if (/orden de compra|\boc\b|purchase order/.test(lower))
    clasificacion = "Orden de compra";
  else if (/contrato|clausul/.test(lower)) clasificacion = "Contrato";
  else if (/remisi/.test(lower)) clasificacion = "Remisión";

  const montoMatch = text.match(
    /(?:total|monto|importe|\$)\s*[:=]?\s*\$?\s*([\d,.]+)/i,
  );
  const monto = montoMatch
    ? Number(montoMatch[1].replace(/,/g, ""))
    : undefined;

  const proveedor =
    text.match(/proveedor[:\s]+([^\n,]+)/i)?.[1]?.trim() ||
    text.match(/emisor[:\s]+([^\n,]+)/i)?.[1]?.trim();
  const cliente =
    text.match(/cliente[:\s]+([^\n,]+)/i)?.[1]?.trim() ||
    text.match(/receptor[:\s]+([^\n,]+)/i)?.[1]?.trim();
  const concepto =
    text.match(/concepto[:\s]+([^\n]+)/i)?.[1]?.trim() ||
    text.match(/descripci[oó]n[:\s]+([^\n]+)/i)?.[1]?.trim();

  const fuzzy = matchExpedienteHeuristic(
    { cliente, proveedor, concepto, archivo, resumen: text.slice(0, 400) },
    expedientes,
  );

  const raw = {
    clasificacion,
    resumen: `Análisis local de ${archivo} (${Math.max(1, Math.round(size / 1024))} KB). Clasificado como ${clasificacion}. ${
      text
        ? "Se extrajo texto del archivo; configura Gemini para un análisis multimodal completo (PDF/imagen)."
        : "Sin texto extraíble; configura una API key de Gemini para OCR y comprensión documental."
    }`,
    proveedor,
    cliente,
    monto: Number.isFinite(monto) ? monto : undefined,
    moneda: "MXN",
    concepto,
    riesgos: [
      "Modo heurístico: precisión limitada sin Gemini",
      !text ? "No se pudo leer contenido textual del archivo" : "",
    ].filter(Boolean),
    entidadesDetectadas: [proveedor, cliente].filter(Boolean) as string[],
    confianzaExtraccion: text ? 0.45 : 0.25,
    expedienteCodigoSugerido: fuzzy?.codigo,
    confianzaMatch: fuzzy?.confianza,
  };

  return normalizeAiResult({
    archivo,
    raw,
    expedientes,
    provider: "heuristic",
    model: "ylika-local-heuristics",
  });
}
