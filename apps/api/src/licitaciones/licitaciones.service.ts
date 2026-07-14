import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

type LicitacionItem = Record<string, unknown>;

/**
 * Catalog of upcoming goods/supply tenders with official downloadable docs.
 * Focus: adquisiciones for integrator companies (not maintenance services).
 * Seed mirrored from apps/web/src/data/licitaciones-sample.json when available.
 */
@Injectable()
export class LicitacionesService {
  private loadSeed(): LicitacionItem[] {
    const candidates = [
      join(
        __dirname,
        '..',
        '..',
        '..',
        '..',
        'web',
        'src',
        'data',
        'licitaciones-sample.json',
      ),
      join(
        process.cwd(),
        '..',
        'web',
        'src',
        'data',
        'licitaciones-sample.json',
      ),
    ];
    for (const p of candidates) {
      try {
        return JSON.parse(readFileSync(p, 'utf8')) as LicitacionItem[];
      } catch {
        /* try next */
      }
    }
    return [];
  }

  list(limit = 120) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const items = this.loadSeed()
      .filter((item) => {
        const ap = String(item.fechaApertura || '');
        const [y, m, d] = ap.split('-').map(Number);
        if (!y || !m || !d) return false;
        const apertura = new Date(y, m - 1, d);
        return apertura.getTime() >= now.getTime();
      })
      .filter((item) => {
        const cat = String(item.categoria || '');
        const tipo = String(item.tipoContratacion || '');
        return cat === 'adquisiciones' || tipo.toUpperCase().includes('ADQUISIC');
      })
      .sort((a, b) =>
        String(a.fechaApertura).localeCompare(String(b.fechaApertura)),
      )
      .slice(0, limit);

    return {
      source: 'adquisiciones-institucionales',
      updatedAt: new Date().toISOString(),
      items,
      note:
        'Solo adquisiciones/suministro sin apertura aún, con documento oficial (PDF/DOC/ZIP). Enfoque integradoras. Fuentes: Puebla, CDMX, Sinaloa Salud.',
    };
  }

  fuentes() {
    return [
      {
        id: 'puebla',
        nombre: 'Licitaciones Puebla',
        url: 'https://licitaciones.puebla.gob.mx/index.php/aquisiciones-bienes-y-servicios/convocatorias-aquisiciones-bienes-y-servicios',
        tipo: 'portal',
      },
      {
        id: 'cdmx-concurso',
        nombre: 'Concurso Digital CDMX',
        url: 'https://concursodigital.finanzas.cdmx.gob.mx/convocatorias_publicas',
        tipo: 'portal',
      },
      {
        id: 'sinaloa-salud',
        nombre: 'CompraNet Sinaloa · Salud',
        url: 'https://compranet.sinaloa.gob.mx/servicios-de-salud-de-sinaloa-sss-adquisiciones',
        tipo: 'portal',
      },
    ];
  }
}
