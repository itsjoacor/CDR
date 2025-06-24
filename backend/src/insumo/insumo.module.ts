import { Module } from '@nestjs/common';
import { InsumoController } from './insumo.controller';
import { InsumoService } from './insumo.service';
import { InsumoRepository } from './insumo.repository';

@Module({
  controllers: [InsumoController],
  providers: [InsumoService, InsumoRepository],
})
export class InsumoModule {}