import { Module } from '@nestjs/common';
import { AutocompleteService } from './autocomplete.service';
import { AutocompleteController } from './autocomplete.controller';
import { InsumoRepository } from '../insumo/insumo.repository';
import { MatrizManoRepository } from '../matrizMano/matiz-mano.repository';
import { MatrizEnergiaRepository } from '../matrizEnergia/matiz-energia.repository';
import { ProductoRepository } from '../productos/producto.repository';

@Module({
  controllers: [AutocompleteController],
  providers: [
    AutocompleteService,
    ProductoRepository,
    InsumoRepository,
    MatrizManoRepository,
    MatrizEnergiaRepository,
  ],
})
export class AutocompleteModule { }