import { Module } from '@nestjs/common';
import { RecetaController } from './receta.controller';
import { RecetaService } from './receta.service';
import { RecetaRepository } from './receta.repository';

@Module({
  controllers: [RecetaController],
  providers: [RecetaService, RecetaRepository],
})
export class RecetaModule {}