import { Injectable } from '@nestjs/common';
import { prospectosSeed } from '../common/seed';

@Injectable()
export class ProspectosService {
  findAll() {
    return prospectosSeed;
  }
}
