import { Controller, Get } from '@nestjs/common';
import { ProspectosService } from './prospectos.service';

@Controller('prospectos')
export class ProspectosController {
  constructor(private readonly prospectosService: ProspectosService) {}

  @Get()
  findAll() {
    return this.prospectosService.findAll();
  }
}
