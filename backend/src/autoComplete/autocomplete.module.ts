import { Module } from '@nestjs/common';
import { AutocompleteService } from './autocomplete.service';
import { AutocompleteController } from './autocomplete.controller';
import { RecetaRepository } from '../receta/receta.repository';
import { InsumoRepository } from '../insumo/insumo.repository';
import { MatrizManoRepository } from '../matrizMano/matiz-mano.repository';
import { MatrizEnergiaRepository } from '../matrizEnergia/matiz-energia.repository';

@Module({
  controllers: [AutocompleteController],
  providers: [
    AutocompleteService,
    RecetaRepository,
    InsumoRepository,
    MatrizManoRepository,
    MatrizEnergiaRepository,
  ],
})
export class AutocompleteModule {}
