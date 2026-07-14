import { Controller, Get, Query } from '@nestjs/common';
import { LicitacionesService } from './licitaciones.service';

@Controller('licitaciones')
export class LicitacionesController {
  constructor(private readonly service: LicitacionesService) {}

  @Get()
  list(@Query('limit') limit?: string) {
    const n = Math.min(120, Math.max(10, Number(limit) || 60));
    return this.service.list(n);
  }

  @Get('fuentes')
  fuentes() {
    return this.service.fuentes();
  }
}
