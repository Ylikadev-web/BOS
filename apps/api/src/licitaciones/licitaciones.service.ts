import { Injectable } from '@nestjs/common';

export type LicitacionCategoria =
  | 'adquisiciones'
  | 'servicios'
  | 'obras'
  | 'arrendamientos'
  | 'otros';

type LicitacionItem = {
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
  fechaJunta?: string;
  fechaApertura: string;
  fechaFallo?: string;
  ley: string;
  ordenGobierno: string;
  urlDocumentoOficial: string;
  urlPortal?: string;
  fuente: string;
  documentos: Array<{
    tipo: string;
    label: string;
    url: string;
    formato: string;
  }>;
};

/**
 * Curated upcoming procedures with verified institutional convocatoria PDFs.
 * Compras MX open-data CSVs are stale and their document API requires captcha,
 * so we do not use them for “aún no inician + documento oficial”.
 */
const UPCOMING: LicitacionItem[] = [
  {
    id: 'iner-ia-n-65-2026',
    codigo: 'IA-12-NCD-012NCD002-N-65-2026',
    referencia: 'IA-12-NCD-012NCD002-N-65-2026',
    titulo:
      'Servicio de mantenimiento preventivo y correctivo a equipos de lavandería',
    institucion:
      'Instituto Nacional de Enfermedades Respiratorias Ismael Cosío Villegas (INER)',
    uc: 'Departamento de Contrataciones de Servicios y Obra Pública',
    categoria: 'servicios',
    tipoProcedimiento:
      'Invitación a cuando menos tres personas nacional electrónica',
    tipoContratacion: 'SERVICIOS',
    caracter: 'Nacional',
    entidad: 'Ciudad de México',
    fechaPublicacion: '2026-07-07',
    fechaApertura: '2026-07-20',
    fechaFallo: '2026-07-27',
    ley: 'Ley de Adquisiciones, Arrendamientos y Servicios del Sector Público',
    ordenGobierno: 'APF',
    urlDocumentoOficial:
      'http://iner.salud.gob.mx/descargas/licitaciones/serviciosmto2026/IA-12-NCD-012NCD002-N-65-2026.pdf',
    urlPortal: 'https://comprasmx.buengobierno.gob.mx/sitiopublico/#/',
    fuente: 'INER · Convocatoria oficial (PDF institucional)',
    documentos: [
      {
        tipo: 'convocatoria',
        label: 'Descargar convocatoria oficial (PDF)',
        url: 'http://iner.salud.gob.mx/descargas/licitaciones/serviciosmto2026/IA-12-NCD-012NCD002-N-65-2026.pdf',
        formato: 'pdf',
      },
    ],
  },
  {
    id: 'iner-ia-n-67-2026',
    codigo: 'IA-12-NCD-012NCD002-N-67-2026',
    referencia: 'IA-12-NCD-012NCD002-N-67-2026',
    titulo:
      'Servicio de mantenimiento preventivo y correctivo a equipos de cocina',
    institucion:
      'Instituto Nacional de Enfermedades Respiratorias Ismael Cosío Villegas (INER)',
    uc: 'Departamento de Contrataciones de Servicios y Obra Pública',
    categoria: 'servicios',
    tipoProcedimiento:
      'Invitación a cuando menos tres personas nacional electrónica',
    tipoContratacion: 'SERVICIOS',
    caracter: 'Nacional',
    entidad: 'Ciudad de México',
    fechaPublicacion: '2026-07-10',
    fechaJunta: '2026-07-15',
    fechaApertura: '2026-07-24',
    fechaFallo: '2026-07-30',
    ley: 'Ley de Adquisiciones, Arrendamientos y Servicios del Sector Público',
    ordenGobierno: 'APF',
    urlDocumentoOficial:
      'http://iner.salud.gob.mx/descargas/licitaciones/serviciosmto2026/IA-12-NCD-012NCD002-N-67-2026.pdf',
    urlPortal: 'https://comprasmx.buengobierno.gob.mx/sitiopublico/#/',
    fuente: 'INER · Convocatoria oficial (PDF institucional)',
    documentos: [
      {
        tipo: 'convocatoria',
        label: 'Descargar convocatoria oficial (PDF)',
        url: 'http://iner.salud.gob.mx/descargas/licitaciones/serviciosmto2026/IA-12-NCD-012NCD002-N-67-2026.pdf',
        formato: 'pdf',
      },
    ],
  },
  {
    id: 'ine-lpn-op-002-2026',
    codigo: 'INE-LPN-OP/002/2026',
    referencia: 'INE-LPN-OP/002/2026',
    titulo:
      'Construcción del edificio sede para la Junta Local Ejecutiva en el Estado de Nuevo León',
    institucion: 'Instituto Nacional Electoral (INE)',
    uc: 'Dirección de Obras y Conservación',
    categoria: 'obras',
    tipoProcedimiento: 'Licitación pública nacional presencial',
    tipoContratacion: 'OBRA PÚBLICA',
    caracter: 'Nacional',
    entidad: 'Nuevo León',
    fechaPublicacion: '2026-06-22',
    fechaJunta: '2026-06-29',
    fechaApertura: '2026-07-15',
    fechaFallo: '2026-08-07',
    ley: 'Reglamento del INE en Materia de Obras Públicas y Servicios Relacionados',
    ordenGobierno: 'Autónomo',
    urlDocumentoOficial:
      'https://www.ine.mx/wp-content/uploads/2026/06/INE-LPN-OP-002-2026-CONV.pdf',
    urlPortal: 'https://www.ine.mx/licitaciones-contrataciones-presenciales/',
    fuente: 'INE · Convocatoria oficial (PDF institucional)',
    documentos: [
      {
        tipo: 'convocatoria',
        label: 'Descargar convocatoria oficial (PDF)',
        url: 'https://www.ine.mx/wp-content/uploads/2026/06/INE-LPN-OP-002-2026-CONV.pdf',
        formato: 'pdf',
      },
      {
        tipo: 'anexo',
        label: 'Liga electrónica / anexos',
        url: 'https://www.ine.mx/wp-content/uploads/2026/06/INE-LPN-OP-002-2026-LIGA.pdf',
        formato: 'pdf',
      },
    ],
  },
];

@Injectable()
export class LicitacionesService {
  list(limit = 60) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const items = UPCOMING.filter((item) => {
      const [y, m, d] = item.fechaApertura.split('-').map(Number);
      const apertura = new Date(y, m - 1, d);
      return apertura.getTime() > now.getTime();
    })
      .sort((a, b) => a.fechaApertura.localeCompare(b.fechaApertura))
      .slice(0, limit);

    return {
      source: 'institutional-pdfs',
      updatedAt: new Date().toISOString(),
      items,
      note:
        'Solo procedimientos con apertura pendiente y PDF oficial de convocatoria verificado. Compras MX no entrega PDFs permanentes sin captcha.',
    };
  }

  fuentes() {
    return [
      {
        id: 'compras-mx-portal',
        nombre: 'Compras MX · Difusión pública',
        url: 'https://comprasmx.buengobierno.gob.mx/sitiopublico/#/',
        tipo: 'portal',
      },
      {
        id: 'ine-licitaciones',
        nombre: 'INE · Licitaciones',
        url: 'https://www.ine.mx/licitaciones-contrataciones-presenciales/',
        tipo: 'portal',
      },
      {
        id: 'iner',
        nombre: 'INER',
        url: 'http://iner.salud.gob.mx/',
        tipo: 'portal',
      },
    ];
  }
}
