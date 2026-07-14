export type LicitacionCategoria =
  | "adquisiciones"
  | "servicios"
  | "obras"
  | "arrendamientos"
  | "otros";

/** Rubros útiles para integradoras / suministro de bienes. */
export type LicitacionRubro =
  | "materiales"
  | "medico"
  | "tecnologia"
  | "insumos_industriales"
  | "mobiliario"
  | "vehicular"
  | "vestuario"
  | "agro"
  | "infraestructura"
  | "suministros";

export type LicitacionDocumento = {
  tipo: "convocatoria" | "portal" | "anexo" | "dataset";
  label: string;
  url: string;
  formato: "pdf" | "portal" | "csv" | "xlsx" | "zip" | "doc";
};

export type LicitacionItem = {
  id: string;
  codigo: string;
  referencia: string;
  titulo: string;
  institucion: string;
  uc: string;
  categoria: LicitacionCategoria;
  rubro?: LicitacionRubro;
  tipoProcedimiento: string;
  tipoContratacion: string;
  caracter: string;
  entidad: string;
  /** ISO date YYYY-MM-DD */
  fechaPublicacion: string;
  fechaJunta?: string;
  /** ISO date — presentación/apertura (criterio de “aún no inicia”) */
  fechaApertura: string;
  fechaFallo?: string;
  ley: string;
  ordenGobierno: string;
  urlDocumentoOficial: string;
  urlPortal?: string;
  uuid?: string;
  fuente: string;
  documentos: LicitacionDocumento[];
};

export type LicitacionFuente = {
  id: string;
  nombre: string;
  descripcion: string;
  url: string;
  tipo: "portal" | "dataset";
  formato?: "csv" | "xlsx" | "zip" | "pdf";
};
