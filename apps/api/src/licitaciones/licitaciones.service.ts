import { Injectable, Logger } from '@nestjs/common';
import { request } from 'https';

export type LicitacionCategoria =
  | 'adquisiciones'
  | 'servicios'
  | 'obras'
  | 'arrendamientos'
  | 'otros';

type RawRow = Record<string, string>;

const CSV_URL =
  'https://upcp-compranet.buengobierno.gob.mx/cnetassets/datos_abiertos_contratos_expedientes/Expedientes_PICompraNet2024.csv';

@Injectable()
export class LicitacionesService {
  private readonly logger = new Logger(LicitacionesService.name);
  private cache: { at: number; items: unknown[] } | null = null;

  async list(limit = 60) {
    if (this.cache && Date.now() - this.cache.at < 1000 * 60 * 60) {
      return {
        source: 'cache',
        updatedAt: new Date(this.cache.at).toISOString(),
        items: this.cache.items.slice(0, limit),
        note: 'Muestra desde datos abiertos Compras MX. Los PDF viven en el portal de cada expediente.',
      };
    }

    try {
      const items = await this.sampleFromCsv(limit);
      this.cache = { at: Date.now(), items };
      return {
        source: 'compras-mx-open-data',
        updatedAt: new Date().toISOString(),
        items,
        note: 'Enlaces a sitiopublico. PDFs oficiales se abren/descargan ahí (API interna con captcha).',
      };
    } catch (err) {
      this.logger.error(
        `No se pudo refrescar CSV: ${err instanceof Error ? err.message : err}`,
      );
      return {
        source: 'error',
        updatedAt: new Date().toISOString(),
        items: [],
        note: 'Falló la descarga de datos abiertos. Usa el snapshot del frontend o reintenta.',
      };
    }
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
        id: 'exp-2024-csv',
        nombre: 'Expedientes PI 2024 CSV',
        url: CSV_URL,
        tipo: 'dataset',
        formato: 'csv',
      },
      {
        id: 'contratos-2025-csv',
        nombre: 'Contratos 2025 CSV',
        url: 'https://upcp-compranet.buengobierno.gob.mx/cnetassets/datos_abiertos_contratos_expedientes/Contratos_CompraNet2025.csv',
        tipo: 'dataset',
        formato: 'csv',
      },
    ];
  }

  private async sampleFromCsv(limit: number) {
    // Header + several byte windows across the ~105MB file (Accept-Ranges).
    const size = 110_387_714;
    const headerBuf = await this.range(0, 120_000);
    const header = headerBuf.toString('latin1').split(/\r?\n/)[0];
    const windows: Buffer[] = [headerBuf];
    for (let start = 5_000_000; start < size; start += 8_000_000) {
      windows.push(await this.range(start, Math.min(start + 160_000, size - 1)));
    }

    const lines: string[] = [];
    const seen = new Set<string>();
    for (let w = 0; w < windows.length; w++) {
      const text = windows[w].toString('latin1');
      const parts = text.split(/\r?\n/);
      for (let i = w === 0 ? 1 : 0; i < parts.length; i++) {
        const line = parts[i];
        if (!line.startsWith('APF,') && !line.startsWith('GE,') && !line.startsWith('GM,')) {
          continue;
        }
        if (seen.has(line)) continue;
        seen.add(line);
        lines.push(line);
      }
    }

    const rows = this.parseCsv([header, ...lines]);
    const byCat: Record<LicitacionCategoria, RawRow[]> = {
      adquisiciones: [],
      servicios: [],
      obras: [],
      arrendamientos: [],
      otros: [],
    };
    for (const r of rows) {
      byCat[this.categoria(r)].push(r);
    }

    const out: unknown[] = [];
    const quotas: [LicitacionCategoria, number][] = [
      ['adquisiciones', Math.ceil(limit * 0.3)],
      ['servicios', Math.ceil(limit * 0.3)],
      ['obras', Math.ceil(limit * 0.25)],
      ['arrendamientos', Math.ceil(limit * 0.1)],
      ['otros', Math.ceil(limit * 0.05)],
    ];

    for (const [cat, n] of quotas) {
      const pool = byCat[cat]
        .filter((r) => (r['Dirección anuncio'] || '').startsWith('http'))
        .sort((a, b) => this.score(b) - this.score(a))
        .slice(0, n);
      for (const r of pool) out.push(this.mapRow(r, cat));
    }
    return out.slice(0, limit);
  }

  private categoria(r: RawRow): LicitacionCategoria {
    const t = (r['Tipo de contratación'] || '').toUpperCase();
    if (t.includes('OBRA')) return 'obras';
    if (t.includes('ADQUISIC')) return 'adquisiciones';
    if (t.includes('SERVIC')) return 'servicios';
    if (t.includes('ARREND')) return 'arrendamientos';
    return 'otros';
  }

  private score(r: RawRow) {
    const p = (r['Tipo Procedimiento'] || '').toUpperCase();
    let s = 0;
    if (p.includes('LICITACIÓN PÚBLICA')) s += 30;
    else if (p.includes('INVITACIÓN')) s += 10;
    const fecha = (r['Fecha de publicación'] || '').slice(0, 10).replace(/-/g, '');
    const n = Number(fecha);
    if (!Number.isNaN(n)) s += n % 100_000_000;
    return s;
  }

  private mapRow(r: RawRow, categoria: LicitacionCategoria) {
    const url = (r['Dirección anuncio'] || '').trim();
    const uuid = url.includes('/detalle/')
      ? url.replace(/\/$/, '').split('/').slice(-2)[0]
      : '';
    return {
      id: (r['Código del expediente'] || uuid).replace(/^'/, ''),
      codigo: (r['Código del expediente'] || '').replace(/^'/, ''),
      referencia: (r['Referencia del expediente'] || '').replace(/^'/, ''),
      titulo: r['Título del expediente'] || r['Nombre anuncio'] || 'Sin título',
      institucion: r['Institución'] || '',
      uc: r['Nombre de la UC'] || '',
      categoria,
      tipoProcedimiento: r['Tipo Procedimiento'] || '',
      tipoContratacion: r['Tipo de contratación'] || '',
      caracter: r['Caracter anuncio'] || '',
      entidad: r['Entidad Federativa'] || '',
      fechaPublicacion: (r['Fecha de publicación'] || '').slice(0, 19),
      vigencia: (r['Vigencia anuncio'] || '').slice(0, 19),
      ley: r['Ley'] || '',
      ordenGobierno: r['Orden de gobierno'] || '',
      urlPortal: url,
      uuid,
      fuente: 'Compras MX · Datos abiertos Expedientes PI 2024',
      documentos: [
        {
          tipo: 'portal',
          label: 'Abrir en Compras MX (ver/descargar PDFs oficiales)',
          url,
          formato: 'portal',
        },
      ],
    };
  }

  private range(start: number, end: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const req = request(
        CSV_URL,
        {
          method: 'GET',
          headers: { Range: `bytes=${start}-${end}` },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => resolve(Buffer.concat(chunks)));
        },
      );
      req.on('error', reject);
      req.setTimeout(60_000, () => {
        req.destroy(new Error('timeout'));
      });
      req.end();
    });
  }

  private parseCsv(lines: string[]): RawRow[] {
    if (!lines.length) return [];
    const headers = this.splitCsvLine(lines[0]);
    const rows: RawRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = this.splitCsvLine(lines[i]);
      if (cols.length < headers.length / 2) continue;
      const row: RawRow = {};
      headers.forEach((h, idx) => {
        row[h] = cols[idx] ?? '';
      });
      rows.push(row);
    }
    return rows;
  }

  private splitCsvLine(line: string): string[] {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        out.push(cur);
        cur = '';
      } else cur += ch;
    }
    out.push(cur);
    return out;
  }
}
