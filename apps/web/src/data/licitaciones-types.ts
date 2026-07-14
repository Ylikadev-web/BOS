export type LicitacionCategoria =
  | "adquisiciones"
  | "servicios"
  | "obras"
  | "arrendamientos"
  | "otros";

export type LicitacionDocumento = {
  tipo: "portal" | "pdf" | "dataset";
  label: string;
  url: string;
  formato: "portal" | "pdf" | "csv" | "xlsx" | "zip";
};

export type LicitacionItem = {
  id: string;
  codigo: string;
  referencia: string;
  titulo: string;
  institucion: string;
  uc: string;
  categoria: LicitacionCategoria;
  tipoProcedimiento: string;
  tipoContratacion: string;
  caracter: string;
  entidad: string;
  fechaPublicacion: string;
  vigencia: string;
  ley: string;
  ordenGobierno: string;
  urlPortal: string;
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
