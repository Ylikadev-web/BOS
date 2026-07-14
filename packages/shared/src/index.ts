export type ExpedienteTipo = "venta_directa" | "proyecto" | "servicio";

export type ExpedienteEstado =
  | "prospecto"
  | "cotizacion"
  | "contrato"
  | "ejecucion"
  | "cobranza"
  | "cerrado"
  | "riesgo";

export type TimelineEstado = "completado" | "activo" | "pendiente" | "riesgo";

export type GraphNodeTipo =
  | "expediente"
  | "cliente"
  | "cotizacion"
  | "pedido"
  | "contrato"
  | "proyecto"
  | "compra"
  | "factura"
  | "cobro"
  | "pago"
  | "rentabilidad"
  | "alerta";

export type GraphNodeEstado = "completado" | "activo" | "pendiente" | "riesgo";

export interface ResumenFinanciero {
  montoVendido: number;
  montoComprado: number;
  facturadoCliente: number;
  cobradoCliente: number;
  facturadoProveedor: number;
  pagadoProveedor: number;
  utilidadBruta: number;
  utilidadNeta: number;
  margen: number;
  roi: number;
}

export interface TimelineEvent {
  id: string;
  label: string;
  sublabel?: string;
  estado: TimelineEstado;
  fecha?: string;
  monto?: number;
}

export interface GraphNode {
  id: string;
  tipo: GraphNodeTipo;
  titulo: string;
  subtitulo?: string;
  monto?: number;
  estado: GraphNodeEstado;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
}

export interface AiInsight {
  id: string;
  severidad: "info" | "warning" | "critical";
  titulo: string;
  descripcion: string;
  impacto: string;
  recomendacion: string;
  entidadRelacionada?: string;
}

export interface ExpedienteNegocio {
  id: string;
  codigo: string;
  nombre: string;
  clienteId: string;
  clienteNombre: string;
  tipo: ExpedienteTipo;
  valor: number;
  estado: ExpedienteEstado;
  avance: number;
  rentabilidad: number;
  ejecutivo: string;
  empresa: string;
  actualizadoEn: string;
  resumen: ResumenFinanciero;
  timeline: TimelineEvent[];
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  insights: AiInsight[];
}

export interface Prospecto {
  id: string;
  codigo: string;
  nombre: string;
  empresa: string;
  etapa: "nuevo" | "calificado" | "propuesta" | "negociacion" | "ganado" | "perdido";
  valorEstimado: number;
  probabilidad: number;
  ejecutivo: string;
  ultimoContacto: string;
  origen: string;
}

export interface Cliente {
  id: string;
  codigo: string;
  nombre: string;
  rfc: string;
  industria: string;
  ejecutivo: string;
  expedientesActivos: number;
  valorCartera: number;
  creditoDisponible: number;
  estado: "activo" | "riesgo" | "inactivo";
}

export interface DocumentoAiResultado {
  archivo: string;
  clasificacion: string;
  proveedor?: string;
  cliente?: string;
  monto?: number;
  concepto?: string;
  proyecto?: string;
  expedienteSugerido?: {
    codigo: string;
    nombre: string;
    confianza: number;
  };
  duplicados?: string[];
  campos: Record<string, string | number>;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
