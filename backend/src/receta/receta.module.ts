import { Module } from '@nestjs/common';
import { RecetaController } from './controller/receta.controller';
import { RecetaService } from './service/receta.service';
import { RecetaRepository } from './repository/receta.repository';

@Module({
  controllers: [RecetaController],
  providers: [RecetaService, RecetaRepository],
})
export class RecetaModule {}