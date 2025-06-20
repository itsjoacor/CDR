import { Module } from '@nestjs/common';
import { RecetaModule } from './receta/receta.module';
import { AutorizacionModule } from './autorizacion/autorizacion.module';
import { InsumoModule } from './insumo/insumo.module';
import { AutocompleteModule } from './autoComplete/autocomplete.module';

@Module({
  imports: [
    RecetaModule,
    AutorizacionModule,
    InsumoModule,
    AutocompleteModule

  ],
})
export class AppModule {}
