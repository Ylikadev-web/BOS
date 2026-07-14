export type LicitacionCategoria =
  | "adquisiciones"
  | "servicios"
  | "obras"
  | "arrendamientos"
  | "otros";

export type LicitacionDocumento = {
  tipo: "convocatoria" | "portal" | "anexo" | "dataset";
  label: string;
  url: string;
  formato: "pdf" | "portal" | "csv" | "xlsx" | "zip";
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
  /** ISO date YYYY-MM-DD */
  fechaPublicacion: string;
  /** ISO date — junta de aclaraciones (si aplica) */
  fechaJunta?: string;
  /** ISO date — presentación y apertura (criterio de “aún no inicia”) */
  fechaApertura: string;
  /** ISO date — fallo estimado */
  fechaFallo?: string;
  ley: string;
  ordenGobierno: string;
  /** URL del PDF oficial de convocatoria (documento principal) */
  urlDocumentoOficial: string;
  /** Expediente en portal público, si existe */
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
