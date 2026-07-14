import type { GraphNodeTipo } from "@ylika/shared";
import { formatCurrency } from "@ylika/shared";
import type { ActionId } from "@/lib/expediente-actions";

export type EntityAction = { id: ActionId; label: string };

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
  relaciones?: { label: string; value: string; actionId?: ActionId }[];
  acciones?: EntityAction[];
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
      lineas: [
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
      ],
      relaciones: [
        { label: "Siguiente", value: "Pedido de venta", actionId: "crear_pedido" },
        { label: "Cliente", value: clienteNombre, actionId: "ir_cliente" },
      ],
      acciones: [
        { id: "download_pdf", label: "Descargar PDF" },
        { id: "crear_pedido", label: "Crear pedido" },
        { id: "enviar_cliente", label: "Enviar al cliente" },
      ],
    };
  }

  if (tipo === "pedido" || /pedido|remisi/i.test(titulo)) {
    return {
      tipo: "pedido",
      titulo: /remisi/i.test(titulo) ? "Remisión" : "Pedido de Venta",
      codigo: `PV-${expedienteCodigo.replace("EXP-", "")}`,
      estado: "Creado",
      monto: baseMonto,
      fecha: "2026-01-18",
      resumen: "Pedido / remisión del flujo de venta del expediente.",
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
          precio: baseMonto || 1,
          total: baseMonto || 1,
        },
      ],
      relaciones: [
        { label: "Siguiente", value: "Remisión / Factura", actionId: "generar_remision" },
      ],
      acciones: [
        { id: "ver_surtido", label: "Ver surtido" },
        { id: "generar_remision", label: "Generar remisión" },
      ],
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
        { label: "Receptor", value: clienteNombre },
        { label: "Método de pago", value: "PPD" },
        { label: "Uso CFDI", value: "G03" },
      ],
      relaciones: [
        { label: "Cobro", value: "Registrar cobro", actionId: "registrar_cobro" },
      ],
      acciones: [
        { id: "download_xml", label: "Ver XML" },
        { id: "download_pdf", label: "Ver PDF" },
        { id: "registrar_cobro", label: "Registrar cobro" },
      ],
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
      ],
      relaciones: [
        { label: "Saldo", value: "Programar seguimiento", actionId: "programar_saldo" },
      ],
      acciones: [
        { id: "conciliar", label: "Conciliar" },
        { id: "programar_saldo", label: "Programar saldo" },
        { id: "registrar_cobro", label: "Registrar otro cobro" },
      ],
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
        {
          label: "Proveedor",
          value: subtitulo?.includes("Electra") ? "Electra S.A." : "Proveedor",
        },
        { label: "Expediente", value: expedienteCodigo },
      ],
      lineas: [
        {
          concepto: "Materiales / servicios del proveedor",
          cantidad: 1,
          precio: baseMonto || 1,
          total: baseMonto || 1,
        },
      ],
      relaciones: [
        { label: "CFDI", value: "Solicitar al proveedor", actionId: "solicitar_cfdi" },
      ],
      acciones: [
        { id: "solicitar_cfdi", label: "Solicitar CFDI" },
        { id: "registrar_recepcion", label: "Registrar recepción" },
      ],
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
      ],
      acciones: [
        { id: "download_pdf", label: "Ver PDF" },
        { id: "abrir_clausulado", label: "Abrir clausulado" },
        { id: "enviar_cliente", label: "Recordar firma" },
      ],
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
      ],
      acciones: [
        { id: "ir_cliente", label: "Ir a cliente" },
        { id: "ver_credito", label: "Ver crédito" },
      ],
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
        { label: "Detalle", value: subtitulo ?? titulo },
      ],
      acciones: [
        { id: "crear_tarea", label: "Crear tarea" },
        { id: "notificar_comprador", label: "Notificar comprador" },
        { id: "solicitar_cfdi", label: "Solicitar CFDI" },
      ],
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
      acciones: [{ id: "ver_finanzas", label: "Ver resumen financiero" }],
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
      ...(baseMonto
        ? [{ label: "Monto", value: formatCurrency(baseMonto) }]
        : []),
    ],
    acciones: [
      { id: "crear_tarea", label: "Crear tarea" },
      { id: "ver_finanzas", label: "Ver finanzas" },
    ],
  };
}
