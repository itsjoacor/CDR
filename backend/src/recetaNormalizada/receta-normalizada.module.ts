import { Module } from '@nestjs/common';
import { RecetaNormalizadaController } from './receta-normalizada.controller';
import { RecetaNormalizadaService } from './receta-normalizada.service';
import { RecetaNormalizadaRepository } from './receta-normalizada.repository';

@Module({
  controllers: [RecetaNormalizadaController],
  providers: [RecetaNormalizadaService, RecetaNormalizadaRepository],
})
export class RecetaNormalizadaModule {}
