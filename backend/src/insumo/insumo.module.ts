import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsumoController } from './controller/insumo.controller';
import { InsumoService } from './service/insumo.service';
import { InsumoRepository } from './repository/insumo.repository';
import { Insumo } from './model/insumo.model';

@Module({
  imports: [TypeOrmModule.forFeature([Insumo, InsumoRepository])],
  controllers: [InsumoController],
  providers: [InsumoService],
  exports: [InsumoService],
})
export class InsumoModule {}