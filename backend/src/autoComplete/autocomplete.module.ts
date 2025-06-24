// src/autocomplete/autocomplete.module.ts
import { Module } from '@nestjs/common';
import { AutocompleteService } from './autocomplete.service';
import { AutocompleteController } from './autocomplete.controller';
import { RecetaRepository } from '../receta/receta.repository';
import { InsumoRepository } from '../insumo/insumo.repository';

@Module({
  providers: [AutocompleteService, RecetaRepository, InsumoRepository],
  controllers: [AutocompleteController]
})
export class AutocompleteModule {}