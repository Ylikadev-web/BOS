import type { DocumentoAiResultado } from "@ylika/shared";

const ALLOWED_EXT = [
  ".pdf",
  ".xml",
  ".xlsx",
  ".xls",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".eml",
  ".msg",
  ".txt",
];

export function isAllowedDocument(file: File) {
  const name = file.name.toLowerCase();
  return ALLOWED_EXT.some((ext) => name.endsWith(ext)) || file.type.length > 0;
}

function classifyFromName(filename: string): Partial<DocumentoAiResultado> {
  const lower = filename.toLowerCase();

  if (lower.includes("cemex") || lower.includes("concreto")) {
    return {
      clasificacion: "Cotización de proveedor",
      proveedor: "CEMEX",
      monto: 450000,
      concepto: "Concreto",
      proyecto: "Planta Norte",
      expedienteSugerido: {
        codigo: "EXP-000875",
        nombre: "Planta Norte",
        confianza: 0.92,
      },
    };
  }

  if (lower.includes("factura") || lower.includes("cfdi") || lower.endsWith(".xml")) {
    return {
      clasificacion: "Factura / CFDI",
      monto: 125000,
      concepto: "Servicios facturados",
      expedienteSugerido: {
        codigo: "EXP-000452",
        nombre: "Venta Directa SHAMOSH",
        confianza: 0.78,
      },
    };
  }

  if (lower.includes("oc") || lower.includes("orden") || lower.includes("compra")) {
    return {
      clasificacion: "Orden de compra",
      proveedor: "Proveedor detectado",
      monto: 210000,
      concepto: "Materiales",
      expedienteSugerido: {
        codigo: "EXP-000875",
        nombre: "Planta Norte",
        confianza: 0.81,
      },
    };
  }

  if (lower.includes("cotiz") || lower.includes("quote") || lower.includes("propuesta")) {
    return {
      clasificacion: "Cotización",
      monto: 180000,
      concepto: "Propuesta comercial",
      expedienteSugerido: {
        codigo: "EXP-000452",
        nombre: "Venta Directa SHAMOSH",
        confianza: 0.74,
      },
    };
  }

  return {
    clasificacion: "Documento comercial",
    monto: 50000,
    concepto: "Pendiente de revisión",
    expedienteSugerido: {
      codigo: "EXP-000875",
      nombre: "Planta Norte",
      confianza: 0.55,
    },
  };
}

/** Client-side AI stub: classifies by filename + optional text peek */
export async function analyzeDocument(file: File): Promise<DocumentoAiResultado> {
  const fromName = classifyFromName(file.name);
  let textHint = "";

  try {
    if (
      file.type.startsWith("text/") ||
      file.name.toLowerCase().endsWith(".xml") ||
      file.name.toLowerCase().endsWith(".csv") ||
      file.name.toLowerCase().endsWith(".txt")
    ) {
      textHint = (await file.text()).slice(0, 2000);
    }
  } catch {
    // binary files — ignore
  }

  if (/shamosh/i.test(textHint) || /shamosh/i.test(file.name)) {
    fromName.cliente = "SHAMOSH";
    fromName.expedienteSugerido = {
      codigo: "EXP-000452",
      nombre: "Venta Directa SHAMOSH",
      confianza: 0.88,
    };
  }

  const proveedor =
    fromName.proveedor ??
    (textHint.match(/proveedor[:\s]+([^\n,]+)/i)?.[1]?.trim() || undefined);

  return {
    archivo: file.name,
    clasificacion: fromName.clasificacion ?? "Documento",
    proveedor,
    cliente: fromName.cliente,
    monto: fromName.monto,
    concepto: fromName.concepto,
    proyecto: fromName.proyecto,
    expedienteSugerido: fromName.expedienteSugerido,
    duplicados: [],
    campos: {
      Archivo: file.name,
      Tamaño: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      Clasificación: fromName.clasificacion ?? "Documento",
      ...(proveedor ? { Proveedor: proveedor } : {}),
      ...(fromName.monto != null ? { Monto: fromName.monto } : {}),
      ...(fromName.concepto ? { Concepto: fromName.concepto } : {}),
      ...(fromName.proyecto ? { Proyecto: fromName.proyecto } : {}),
    },
  };
}
