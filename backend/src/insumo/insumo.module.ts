import { Module } from '@nestjs/common';
import { InsumoController } from './controller/insumo.controller';
import { InsumoService } from './service/insumo.service';
import { InsumoRepository } from './repository/insumo.repository';

@Module({
  controllers: [InsumoController],
  providers: [InsumoService, InsumoRepository],
})
export class InsumoModule {}