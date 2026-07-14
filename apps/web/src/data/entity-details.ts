import type { GraphNodeTipo } from "@ylika/shared";
import { formatCurrency } from "@ylika/shared";

export type EntityDetail = {
  tipo: GraphNodeTipo | string;
  titulo: string;
  codigo?: string;
  estado?: string;
  monto?: number;
  fecha?: string;
  resumen: string;
  campos: { label: string; value: string }[];
  lineas?: { concepto: string; cantidad: number; precio: number; total: number }[];
  relaciones?: { label: string; value: string }[];
  acciones?: string[];
};

export function resolveEntityDetail(input: {
  tipo: string;
  titulo: string;
  subtitulo?: string;
  monto?: number;
  expedienteCodigo: string;
  clienteNombre: string;
}): EntityDetail {
  const { tipo, titulo, subtitulo, monto, expedienteCodigo, clienteNombre } =
    input;

  const baseMonto = monto ?? 0;

  if (tipo === "cotizacion" || /cotizaci/i.test(titulo)) {
    const lineas = [
      {
        concepto: "Suministro e instalación — alcance principal",
        cantidad: 1,
        precio: Math.round(baseMonto * 0.72),
        total: Math.round(baseMonto * 0.72),
      },
      {
        concepto: "Supervisión y puesta en marcha",
        cantidad: 1,
        precio: Math.round(baseMonto * 0.18),
        total: Math.round(baseMonto * 0.18),
      },
      {
        concepto: "Flete y logística",
        cantidad: 1,
        precio: Math.round(baseMonto * 0.1),
        total: Math.round(baseMonto * 0.1),
      },
    ];
    return {
      tipo: "cotizacion",
      titulo: "Previsualización de Cotización",
      codigo: `COT-${expedienteCodigo.replace("EXP-", "")}`,
      estado: subtitulo ?? "Aprobada",
      monto: baseMonto,
      fecha: "2026-01-12",
      resumen: `Cotización vinculada a ${clienteNombre} dentro de ${expedienteCodigo}.`,
      campos: [
        { label: "Cliente", value: clienteNombre },
        { label: "Expediente", value: expedienteCodigo },
        { label: "Vigencia", value: "30 días" },
        { label: "Condiciones", value: "50% anticipo · 50% contra entrega" },
      ],
      lineas,
      relaciones: [
        { label: "Siguiente", value: "Pedido de venta" },
        { label: "Origen", value: "Prospecto / negociación" },
      ],
      acciones: ["Descargar PDF", "Crear pedido", "Enviar al cliente"],
    };
  }

  if (tipo === "pedido" || /pedido/i.test(titulo)) {
    return {
      tipo: "pedido",
      titulo: "Pedido de Venta",
      codigo: `PV-${expedienteCodigo.replace("EXP-", "")}`,
      estado: "Creado",
      monto: baseMonto,
      fecha: "2026-01-18",
      resumen: "Pedido generado a partir de la cotización aprobada.",
      campos: [
        { label: "Cliente", value: clienteNombre },
        { label: "Expediente", value: expedienteCodigo },
        { label: "Entrega estimada", value: "2026-02-02" },
        { label: "Almacén", value: "CDMX Norte" },
      ],
      lineas: [
        {
          concepto: "Partida principal del pedido",
          cantidad: 1,
          precio: baseMonto,
          total: baseMonto,
        },
      ],
      relaciones: [
        { label: "Origen", value: "Cotización aprobada" },
        { label: "Siguiente", value: "Remisión / Factura" },
      ],
      acciones: ["Ver surtido", "Generar remisión"],
    };
  }

  if (tipo === "factura" || /factura/i.test(titulo)) {
    return {
      tipo: "factura",
      titulo: "Factura",
      codigo: `FAC-${expedienteCodigo.replace("EXP-", "")}`,
      estado: "Emitida",
      monto: baseMonto,
      fecha: "2026-02-05",
      resumen: "Comprobante fiscal asociado al expediente.",
      campos: [
        { label: "UUID", value: "A1B2C3D4-E5F6-7890-ABCD-EF1234567890" },
        { label: "Cliente / Proveedor", value: clienteNombre },
        { label: "Método de pago", value: "PPD — Pago en parcialidades" },
        { label: "Uso CFDI", value: "G03 — Gastos en general" },
      ],
      relaciones: [
        { label: "Expediente", value: expedienteCodigo },
        { label: "Cobro / Pago", value: "Parcial o pendiente" },
      ],
      acciones: ["Ver XML", "Ver PDF", "Registrar cobro"],
    };
  }

  if (tipo === "cobro" || /cobr/i.test(titulo)) {
    return {
      tipo: "cobro",
      titulo: "Cobro de Cliente",
      codigo: `COB-${expedienteCodigo.replace("EXP-", "")}`,
      estado: "Parcial",
      monto: baseMonto,
      fecha: "2026-03-01",
      resumen: "Movimiento de tesorería vinculado a factura del expediente.",
      campos: [
        { label: "Cuenta bancaria", value: "BBVA · ****4521" },
        { label: "Referencia", value: "SPEI-908812" },
        { label: "Expediente", value: expedienteCodigo },
        { label: "Saldo pendiente", value: formatCurrency(Math.max(0, 60000)) },
      ],
      relaciones: [
        { label: "Factura", value: `FAC-${expedienteCodigo.replace("EXP-", "")}` },
        { label: "Cliente", value: clienteNombre },
      ],
      acciones: ["Conciliar", "Programar saldo"],
    };
  }

  if (tipo === "compra" || /orden|compra|oc-/i.test(titulo)) {
    return {
      tipo: "compra",
      titulo: "Orden de Compra",
      codigo: subtitulo?.match(/OC-\d+/)?.[0] ?? "OC-001",
      estado: "Emitida",
      monto: baseMonto,
      fecha: "2026-02-14",
      resumen: "Compra ligada al expediente para cubrir el alcance vendido.",
      campos: [
        { label: "Proveedor", value: subtitulo?.includes("Electra") ? "Electra S.A." : "Proveedor" },
        { label: "Expediente", value: expedienteCodigo },
        { label: "Entrega", value: "Pendiente / Parcial" },
      ],
      lineas: [
        {
          concepto: "Materiales / servicios del proveedor",
          cantidad: 1,
          precio: baseMonto,
          total: baseMonto,
        },
      ],
      relaciones: [
        { label: "Siguiente", value: "Factura proveedor → Pago" },
        { label: "Impacto", value: "Rentabilidad del expediente" },
      ],
      acciones: ["Solicitar CFDI", "Registrar recepción"],
    };
  }

  if (tipo === "contrato" || /contrato/i.test(titulo)) {
    return {
      tipo: "contrato",
      titulo: "Contrato",
      codigo: `CTR-${expedienteCodigo.replace("EXP-", "")}`,
      estado: "Firmado",
      monto: baseMonto,
      fecha: "2025-11-20",
      resumen: "Marco contractual del proyecto / operación.",
      campos: [
        { label: "Cliente", value: clienteNombre },
        { label: "Expediente", value: expedienteCodigo },
        { label: "Firma", value: "Digital · completa" },
      ],
      relaciones: [
        { label: "Proyecto", value: titulo },
        { label: "Siguiente", value: "Ingeniería de costos / compras" },
      ],
      acciones: ["Ver PDF", "Abrir clausulado"],
    };
  }

  if (tipo === "cliente") {
    return {
      tipo: "cliente",
      titulo: clienteNombre,
      estado: "Activo",
      resumen: "Ficha del cliente relacionado al expediente.",
      campos: [
        { label: "Nombre", value: clienteNombre },
        { label: "Expediente actual", value: expedienteCodigo },
        { label: "Relación", value: "Cliente del expediente" },
      ],
      relaciones: [
        { label: "Expedientes", value: expedienteCodigo },
        { label: "Contactos", value: "Ver en módulo Clientes" },
      ],
      acciones: ["Ir a cliente", "Ver crédito"],
    };
  }

  if (tipo === "alerta" || /riesgo|pendiente|entrega/i.test(titulo)) {
    return {
      tipo: "alerta",
      titulo,
      estado: "Riesgo",
      resumen: subtitulo ?? "Señal detectada por IA en el expediente.",
      campos: [
        { label: "Expediente", value: expedienteCodigo },
        { label: "Severidad", value: "Alta" },
        { label: "Detalle", value: subtitulo ?? titulo },
      ],
      relaciones: [
        { label: "Objeto", value: "OC / Factura / Entrega" },
        { label: "Impacto", value: "Retraso / margen" },
      ],
      acciones: ["Crear tarea", "Notificar comprador"],
    };
  }

  if (tipo === "rentabilidad") {
    return {
      tipo: "rentabilidad",
      titulo: "Rentabilidad del expediente",
      estado: "Calculada",
      resumen: "Resumen financiero vivo de la operación.",
      campos: [
        { label: "Expediente", value: expedienteCodigo },
        { label: "Indicador", value: subtitulo ?? "Margen" },
      ],
      relaciones: [
        { label: "Origen", value: "Vendido − Comprado − Costos" },
      ],
      acciones: ["Ver resumen financiero"],
    };
  }

  return {
    tipo,
    titulo,
    estado: subtitulo,
    monto: baseMonto || undefined,
    resumen: `Detalle de ${titulo} en ${expedienteCodigo}.`,
    campos: [
      { label: "Expediente", value: expedienteCodigo },
      { label: "Cliente", value: clienteNombre },
      ...(subtitulo ? [{ label: "Detalle", value: subtitulo }] : []),
      ...(baseMonto
        ? [{ label: "Monto", value: formatCurrency(baseMonto) }]
        : []),
    ],
    relaciones: [{ label: "Contexto", value: "Business Graph / Timeline" }],
    acciones: ["Cerrar"],
  };
}
