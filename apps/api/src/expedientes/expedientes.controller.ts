import { Controller, Get, Param } from '@nestjs/common';
import { ExpedientesService } from './expedientes.service';

@Controller('expedientes')
export class ExpedientesController {
  constructor(private readonly expedientesService: ExpedientesService) {}

  @Get()
  findAll() {
    return this.expedientesService.findAll();
  }

  @Get(':codigo')
  findOne(@Param('codigo') codigo: string) {
    return this.expedientesService.findByCodigo(codigo);
  }

  @Get(':codigo/timeline')
  timeline(@Param('codigo') codigo: string) {
    return this.expedientesService.timeline(codigo);
  }

  @Get(':codigo/graph')
  graph(@Param('codigo') codigo: string) {
    return this.expedientesService.graph(codigo);
  }

  @Get(':codigo/insights')
  insights(@Param('codigo') codigo: string) {
    return this.expedientesService.insights(codigo);
  }
}
