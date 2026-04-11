import { Module } from '@nestjs/common';
import { ReferenciasController } from './referencias.controller';
import { ReferenciasService } from './referencias.service';
import { ReferenciasRepository } from './referencias.repository';

@Module({
  controllers: [ReferenciasController],
  providers: [ReferenciasService, ReferenciasRepository],
  exports: [ReferenciasService],
})
export class ReferenciasModule {}
