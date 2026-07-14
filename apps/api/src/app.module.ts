import { Module } from '@nestjs/common';
import { ExpedientesModule } from './expedientes/expedientes.module';
import { ProspectosModule } from './prospectos/prospectos.module';
import { ClientesModule } from './clientes/clientes.module';
import { AiModule } from './ai/ai.module';
import { HealthController } from './health.controller';

@Module({
  imports: [ExpedientesModule, ProspectosModule, ClientesModule, AiModule],
  controllers: [HealthController],
})
export class AppModule {}
