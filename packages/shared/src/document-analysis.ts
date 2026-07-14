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

/** Qué debe hacer YLIKA con el documento en el expediente */
export type IntencionOperativa =
  | "cotizacion_venta"
  | "cotizacion_proveedor"
  | "orden_compra"
  | "pedido_venta"
  | "factura_cliente"
  | "factura_proveedor"
  | "cobro"
  | "pago"
  | "contrato"
  | "remision"
  | "lista_productos"
  | "anexo_economico"
  | "licitacion"
  | "correo_seguimiento"
  | "otro";

export interface DocumentoAiResultado {
  archivo: string;
  clasificacion: string;
  /** Intención operativa para el BOS */
  intencion?: IntencionOperativa;
  /** Gobierno o privado detectado en el documento */
  sector?: "gobierno" | "privado";
  /** Modalidad sugerida para el expediente */
  modalidad?: "venta_directa" | "proyecto" | "servicio";
  /** Rol de YLIKA respecto al documento */
  rolYlika?: "vendedor" | "comprador" | "interno" | "indefinido";
  proveedor?: string;
  cliente?: string;
  monto?: number;
  concepto?: string;
  proyecto?: string;
  /** Resumen ejecutivo */
  resumen?: string;
  /** Cadena de razonamiento: por qué clasificó así y qué hacer */
  razonamiento?: string;
  /** Siguiente paso concreto recomendado al usuario */
  siguientePaso?: string;
  fecha?: string;
  moneda?: string;
  rfcEmisor?: string;
  rfcReceptor?: string;
  riesgos?: string[];
  entidadesDetectadas?: string[];
  /** Partidas / productos detectados */
  partidas?: Array<{
    descripcion: string;
    cantidad?: number;
    precio?: number;
    total?: number;
  }>;
  confianzaExtraccion?: number;
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

/** Pro para anexos/PDF densos; Flash como fallback rápido */
export const DOCUMENT_ANALYSIS_MODEL = "gemini-2.5-pro";
export const DOCUMENT_ANALYSIS_MODEL_FAST = "gemini-2.5-flash";

export const DOCUMENT_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  properties: {
    clasificacion: {
      type: "string",
      description:
        "Etiqueta humana precisa. Ej: Anexo económico de licitación, Cotización proveedor, CFDI ingreso, Lista de partidas, etc.",
    },
    intencion: {
      type: "string",
      description:
        "Una de: cotizacion_venta, cotizacion_proveedor, orden_compra, pedido_venta, factura_cliente, factura_proveedor, cobro, pago, contrato, remision, lista_productos, anexo_economico, licitacion, correo_seguimiento, otro",
    },
    sector: {
      type: "string",
      description: "gobierno o privado",
    },
    modalidad: {
      type: "string",
      description: "venta_directa, proyecto o servicio",
    },
    rolYlika: {
      type: "string",
      description: "vendedor, comprador, interno o indefinido",
    },
    resumen: {
      type: "string",
      description: "2-4 oraciones en español, accionables",
    },
    razonamiento: {
      type: "string",
      description:
        "Explica con detalle: señales del documento, por qué sector, por qué intención, qué campos usaste. Mínimo 4 oraciones.",
    },
    siguientePaso: {
      type: "string",
      description:
        "Instrucción concreta: crear expediente gobierno, registrar cobro, asociar como OC, etc.",
    },
    proveedor: { type: "string" },
    cliente: { type: "string" },
    monto: { type: "number" },
    moneda: { type: "string" },
    concepto: { type: "string" },
    proyecto: { type: "string" },
    fecha: { type: "string" },
    rfcEmisor: { type: "string" },
    rfcReceptor: { type: "string" },
    riesgos: { type: "array", items: { type: "string" } },
    entidadesDetectadas: { type: "array", items: { type: "string" } },
    partidas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          descripcion: { type: "string" },
          cantidad: { type: "number" },
          precio: { type: "number" },
          total: { type: "number" },
        },
        required: ["descripcion"],
      },
    },
    confianzaExtraccion: { type: "number" },
    expedienteCodigoSugerido: { type: "string" },
    confianzaMatch: { type: "number" },
  },
  required: [
    "clasificacion",
    "intencion",
    "sector",
    "resumen",
    "razonamiento",
    "siguientePaso",
    "confianzaExtraccion",
  ],
} as const;

export function buildDocumentAnalysisPrompt(
  filename: string,
  expedientes: ExpedienteMatchHint[],
  textExcerpt?: string,
) {
  const catalog =
    expedientes.length === 0
      ? "(sin catálogo de expedientes)"
      : expedientes
          .map(
            (e) =>
              `- ${e.codigo} · ${e.nombre} · cliente ${e.clienteNombre}`,
          )
          .join("\n");

  return `Eres el analista documental senior de YLIKA (Business Operating System, México).
Tu trabajo NO es etiquetar a la ligera: debes PENSAR EN EXTREMO sobre qué es el documento, para qué sirve en una operación comercial/gubernamental, y qué acción debe tomar el sistema.

Archivo: ${filename}

Catálogo de expedientes activos (match solo si hay evidencia clara):
${catalog}

## Cómo pensar (obligatorio)
1. Lee TODO el contenido visible (membretes, oficios, anexos, tablas, firmas, sellos, RFCs, dependencias, partidas).
2. Identifica el GÉNERO real del documento. Ejemplos:
   - Anexo económico / cotización económica de licitación o concurso
   - Cotización de venta al cliente
   - Cotización de proveedor hacia YLIKA
   - Orden de compra, pedido, remisión
   - Factura/CFDI (ingreso o egreso)
   - Comprobante de cobro o pago (SPEI, ficha, estado de cuenta)
   - Contrato / convenio
   - Lista de productos/partidas de un proyecto
   - Oficio de dependencia de gobierno
3. Decide sector:
   - gobierno: municipios, secretarías, organismos públicos, oficios, bases de licitación, anexos de concurso, claves de procedimiento, "invitación restringida", "licitación pública", etc.
   - privado: empresas mercantiles, SA/SAPI/SRL, sin señales de dependencia pública.
4. Decide intención operativa (campo intencion) — UNA sola, la más útil para el BOS.
5. Extrae cliente y proveedor con nombres reales del documento. NUNCA inventes "Nuevo cliente".
   - Si es anexo/licitación gobierno: el cliente suele ser la dependencia/organismo convocante.
   - Si es cotización proveedor: proveedor = quien cotiza; cliente = a quien se cotiza (a menudo el dueño del proyecto).
6. Monto: suma o total explícito del anexo/tabla. Si hay varias cifras, usa el TOTAL / importe económico.
7. Proyecto: nombre de obra, procedimiento, oficio o anexo si aparece (ej. Ofic. 0782026, Planta Norte).
8. Modalidad: proyecto (obras/anexos/licitaciones), venta_directa (suministro puntual), servicio (mantenimiento/consultoría).
9. siguientePaso debe ser accionable en YLIKA (crear expediente gobierno, asociar como cobro, registrar OC, etc.).
10. razonamiento: explica evidencias. Si algo no está claro, dilo y baja confianzaExtraccion.

## Prohibido
- Devolver cliente vacío o genérico si el PDF tiene un nombre de dependencia/empresa.
- Clasificar todo como "Documento comercial".
- Ignorar señales de gobierno en oficios/anexos.
- Inventar montos redondos sin evidencia.

Responde SOLO JSON válido según el schema.
${textExcerpt ? `\nContenido textual parcial:\n---\n${textExcerpt.slice(0, 14000)}\n---` : "\nEl PDF/imagen multimodal está adjunto: léelo completo."}`;
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

export function labelIntencion(intencion?: IntencionOperativa): string {
  const map: Record<IntencionOperativa, string> = {
    cotizacion_venta: "Cotización de venta",
    cotizacion_proveedor: "Cotización de proveedor",
    orden_compra: "Orden de compra",
    pedido_venta: "Pedido de venta",
    factura_cliente: "Factura a cliente",
    factura_proveedor: "Factura de proveedor",
    cobro: "Cobro / ingreso",
    pago: "Pago a proveedor",
    contrato: "Contrato",
    remision: "Remisión",
    lista_productos: "Lista de productos / partidas",
    anexo_economico: "Anexo económico",
    licitacion: "Licitación / concurso",
    correo_seguimiento: "Correo de seguimiento",
    otro: "Otro documento",
  };
  return intencion ? map[intencion] : "Por clasificar";
}

type RawAiJson = {
  clasificacion?: string;
  intencion?: string;
  sector?: string;
  modalidad?: string;
  rolYlika?: string;
  resumen?: string;
  razonamiento?: string;
  siguientePaso?: string;
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
  partidas?: Array<{
    descripcion: string;
    cantidad?: number;
    precio?: number;
    total?: number;
  }>;
  confianzaExtraccion?: number;
  expedienteCodigoSugerido?: string;
  confianzaMatch?: number;
};

const INTENCIONES: IntencionOperativa[] = [
  "cotizacion_venta",
  "cotizacion_proveedor",
  "orden_compra",
  "pedido_venta",
  "factura_cliente",
  "factura_proveedor",
  "cobro",
  "pago",
  "contrato",
  "remision",
  "lista_productos",
  "anexo_economico",
  "licitacion",
  "correo_seguimiento",
  "otro",
];

function parseIntencion(raw?: string): IntencionOperativa {
  const v = (raw || "").trim().toLowerCase().replace(/\s+/g, "_");
  if (INTENCIONES.includes(v as IntencionOperativa)) {
    return v as IntencionOperativa;
  }
  if (/anexo|econom/.test(v)) return "anexo_economico";
  if (/licit|concurso|invitacion/.test(v)) return "licitacion";
  if (/cotiz.*prov|proveedor/.test(v)) return "cotizacion_proveedor";
  if (/cotiz/.test(v)) return "cotizacion_venta";
  if (/cobr|spei|ingreso/.test(v)) return "cobro";
  if (/pago|egreso/.test(v)) return "pago";
  if (/factura.*prov|cfdi.*e/.test(v)) return "factura_proveedor";
  if (/factura|cfdi/.test(v)) return "factura_cliente";
  if (/orden|oc-/.test(v)) return "orden_compra";
  if (/lista|partida|producto/.test(v)) return "lista_productos";
  return "otro";
}

function parseSector(raw?: string, haystack = ""): "gobierno" | "privado" {
  const s = (raw || "").toLowerCase();
  if (s.startsWith("gob")) return "gobierno";
  if (s.startsWith("priv")) return "privado";
  if (
    /gobierno|municipio|secretar|licitaci|oficio|dependencia|concurso|invitaci[oó]n|p[uú]blic/.test(
      haystack,
    )
  ) {
    return "gobierno";
  }
  return "privado";
}

export function normalizeAiResult(input: {
  archivo: string;
  raw: RawAiJson;
  expedientes: ExpedienteMatchHint[];
  provider: DocumentoAiProvider;
  model?: string;
}): DocumentoAiResultado {
  const { archivo, raw, expedientes, provider, model } = input;
  const haystack = [
    raw.clasificacion,
    raw.resumen,
    raw.razonamiento,
    raw.cliente,
    raw.proveedor,
    raw.proyecto,
    raw.concepto,
    archivo,
  ]
    .filter(Boolean)
    .join(" ");

  const intencion = parseIntencion(raw.intencion || raw.clasificacion);
  const sector = parseSector(raw.sector, haystack);
  const modalidad =
    raw.modalidad === "proyecto" ||
    raw.modalidad === "servicio" ||
    raw.modalidad === "venta_directa"
      ? raw.modalidad
      : /proyecto|obra|licit|anexo/.test(haystack.toLowerCase())
        ? "proyecto"
        : /servicio|manten/.test(haystack.toLowerCase())
          ? "servicio"
          : "venta_directa";

  const rolYlika =
    raw.rolYlika === "vendedor" ||
    raw.rolYlika === "comprador" ||
    raw.rolYlika === "interno" ||
    raw.rolYlika === "indefinido"
      ? raw.rolYlika
      : intencion === "cotizacion_proveedor" ||
          intencion === "orden_compra" ||
          intencion === "factura_proveedor" ||
          intencion === "pago"
        ? "comprador"
        : "vendedor";

  let cliente = (raw.cliente || "").trim();
  let proveedor = (raw.proveedor || "").trim();
  // Evitar placeholders inútiles
  if (/^nuevo cliente$/i.test(cliente) || /^cliente$/i.test(cliente)) {
    cliente = "";
  }
  if (!cliente) {
    // Heurística post-IA: entidades o proyecto
    const ent = (raw.entidadesDetectadas || []).find(
      (e) => e && !/^rfc/i.test(e) && e.length > 3,
    );
    if (ent) cliente = ent;
  }

  const codigo = (raw.expedienteCodigoSugerido || "").trim().toUpperCase();
  const matched = expedientes.find(
    (e) => e.codigo.toUpperCase() === codigo,
  );
  const fuzzy =
    matched ??
    matchExpedienteHeuristic(
      {
        cliente,
        proveedor,
        proyecto: raw.proyecto,
        concepto: raw.concepto,
        resumen: raw.resumen,
        archivo,
      },
      expedientes,
    );

  const campos: Record<string, string | number> = {
    Archivo: archivo,
    Clasificación: raw.clasificacion ?? labelIntencion(intencion),
    Intención: labelIntencion(intencion),
    Sector: sector === "gobierno" ? "Gobierno" : "Privado",
  };
  if (cliente) campos.Cliente = cliente;
  if (proveedor) campos.Proveedor = proveedor;
  if (raw.monto != null) campos.Monto = raw.monto;
  if (raw.moneda) campos.Moneda = raw.moneda;
  if (raw.concepto) campos.Concepto = raw.concepto;
  if (raw.proyecto) campos.Proyecto = raw.proyecto;
  if (raw.fecha) campos.Fecha = raw.fecha;
  if (raw.rfcEmisor) campos["RFC emisor"] = raw.rfcEmisor;
  if (raw.rfcReceptor) campos["RFC receptor"] = raw.rfcReceptor;

  return {
    archivo,
    clasificacion: raw.clasificacion || labelIntencion(intencion),
    intencion,
    sector,
    modalidad,
    rolYlika,
    resumen: raw.resumen,
    razonamiento: raw.razonamiento,
    siguientePaso: raw.siguientePaso,
    proveedor: proveedor || undefined,
    cliente: cliente || undefined,
    monto: typeof raw.monto === "number" ? raw.monto : undefined,
    moneda: raw.moneda || "MXN",
    concepto: raw.concepto || undefined,
    proyecto: raw.proyecto || undefined,
    fecha: raw.fecha || undefined,
    rfcEmisor: raw.rfcEmisor || undefined,
    rfcReceptor: raw.rfcReceptor || undefined,
    riesgos: raw.riesgos?.filter(Boolean) ?? [],
    entidadesDetectadas: raw.entidadesDetectadas?.filter(Boolean) ?? [],
    partidas: raw.partidas?.filter((p) => p?.descripcion) ?? [],
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
              : ((fuzzy as { confianza?: number }).confianza ?? 0.55),
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
  const tipoComp = attr("(?:cfdi:)?Comprobante", "TipoDeComprobante");
  const intencion: IntencionOperativa =
    tipoComp === "E" ? "factura_proveedor" : "factura_cliente";

  const raw = {
    clasificacion: "Factura / CFDI",
    intencion,
    sector: "privado",
    modalidad: "venta_directa",
    rolYlika: tipoComp === "E" ? "comprador" : "vendedor",
    resumen: `CFDI de ${emisor || "emisor"} hacia ${receptor || "receptor"}${
      Number.isFinite(total) ? ` por $${total.toLocaleString("es-MX")}` : ""
    }. ${desc ? `Concepto: ${desc}.` : ""}`.trim(),
    razonamiento:
      "Documento XML CFDI parseado localmente: se leyeron Emisor, Receptor, Total y conceptos del comprobante fiscal.",
    siguientePaso:
      tipoComp === "E"
        ? "Asociar como factura de proveedor y registrar recepción."
        : "Asociar como factura a cliente y preparar cobro.",
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
  let intencion: IntencionOperativa = "otro";
  let clasificacion = "Documento sin análisis Gemini";
  let sector: "gobierno" | "privado" = "privado";

  if (/anexo\s*econ|anexo_econ|econ[oó]mico/.test(lower)) {
    intencion = "anexo_economico";
    clasificacion = "Anexo económico";
  } else if (/licit|concurso|invitaci[oó]n\s+restringida|bases\s+de/.test(lower)) {
    intencion = "licitacion";
    clasificacion = "Licitación / concurso";
  } else if (/factura|cfdi|uuid/.test(lower)) {
    intencion = "factura_cliente";
    clasificacion = "Factura / CFDI";
  } else if (/cotiz|quote|propuesta/.test(lower)) {
    intencion = /prov/.test(lower) ? "cotizacion_proveedor" : "cotizacion_venta";
    clasificacion = intencion === "cotizacion_proveedor"
      ? "Cotización de proveedor"
      : "Cotización de venta";
  } else if (/orden de compra|\boc\b|purchase order/.test(lower)) {
    intencion = "orden_compra";
    clasificacion = "Orden de compra";
  } else if (/cobr|spei|pago\s+recibido/.test(lower)) {
    intencion = "cobro";
    clasificacion = "Comprobante de cobro";
  } else if (/lista|partida|producto/.test(lower)) {
    intencion = "lista_productos";
    clasificacion = "Lista de productos";
  }

  if (
    /gobierno|municipio|secretar|oficio|licitaci|dependencia|p[uú]blic|concurso/.test(
      lower,
    ) ||
    /ofic\.|oficio/.test(lower)
  ) {
    sector = "gobierno";
  }

  // Intentar nombre desde filename
  const oficio =
    archivo.match(/ofic\.?\s*([0-9/-]+)/i)?.[1] ||
    archivo.match(/(\d{5,})/)?.[1];
  const proyecto =
    /anexo/i.test(archivo)
      ? `Anexo económico${oficio ? ` Ofic. ${oficio}` : ""}`
      : undefined;

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
    text.match(/receptor[:\s]+([^\n,]+)/i)?.[1]?.trim() ||
    text.match(/convocante[:\s]+([^\n,]+)/i)?.[1]?.trim();

  const fuzzy = matchExpedienteHeuristic(
    { cliente, proveedor, concepto: clasificacion, archivo, resumen: text.slice(0, 400) },
    expedientes,
  );

  const raw = {
    clasificacion,
    intencion,
    sector,
    modalidad: sector === "gobierno" || intencion === "anexo_economico"
      ? "proyecto"
      : "venta_directa",
    resumen: `Análisis LOCAL limitado de ${archivo}. Sin Gemini no se puede leer el PDF multimodal. Configura la API key para extraer cliente, sector y partidas reales.`,
    razonamiento:
      "No hubo llamada a Gemini. Solo se usaron el nombre del archivo y texto extraíble. Un anexo económico en PDF requiere visión multimodal.",
    siguientePaso:
      "Configura Gemini (API key) y vuelve a analizar el mismo archivo antes de crear el expediente.",
    proveedor,
    cliente,
    monto: Number.isFinite(monto) ? monto : undefined,
    moneda: "MXN",
    concepto: clasificacion,
    proyecto,
    riesgos: [
      "Gemini no ejecutó el análisis — resultado incompleto",
      !text ? "PDF/imagen sin texto extraíble en modo local" : "",
    ].filter(Boolean),
    entidadesDetectadas: [proveedor, cliente].filter(Boolean) as string[],
    confianzaExtraccion: text ? 0.2 : 0.1,
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
