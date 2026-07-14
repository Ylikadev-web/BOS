import { Injectable } from '@nestjs/common';
import { clientesSeed } from '../common/seed';

@Injectable()
export class ClientesService {
  findAll() {
    return clientesSeed;
  }
}
