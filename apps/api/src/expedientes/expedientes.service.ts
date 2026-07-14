import { Injectable, NotFoundException } from '@nestjs/common';
import { expedientesSeed } from '../common/seed';

@Injectable()
export class ExpedientesService {
  findAll() {
    return expedientesSeed.map((e) => ({
      id: e.id,
      codigo: e.codigo,
      nombre: e.nombre,
      clienteNombre: e.clienteNombre,
      tipo: e.tipo,
      valor: e.valor,
      estado: e.estado,
      avance: e.avance,
      rentabilidad: e.rentabilidad,
      ejecutivo: e.ejecutivo,
      actualizadoEn: e.actualizadoEn,
    }));
  }

  findByCodigo(codigo: string) {
    const expediente = expedientesSeed.find(
      (e) => e.codigo.toLowerCase() === codigo.toLowerCase(),
    );
    if (!expediente) {
      throw new NotFoundException(`Expediente ${codigo} no encontrado`);
    }
    return expediente;
  }

  timeline(codigo: string) {
    return this.findByCodigo(codigo).timeline;
  }

  graph(codigo: string) {
    return this.findByCodigo(codigo).graph;
  }

  insights(codigo: string) {
    return this.findByCodigo(codigo).insights;
  }
}
