import { Module } from '@nestjs/common';
import { RecetaModule } from './receta/receta.module';
import { InsumoModule } from './insumo/insumo.module';
import { AutocompleteModule } from './autoComplete/autocomplete.module';
import { ProductoModule } from './productos/producto.module';
import { ResultadosCdrModule } from './resultadosCDR/resultado-cdr.module';
import { MatrizManoModule } from './matrizMano/matriz-mano.module';
import { MatrizEnergiaModule } from './matrizEnergia/matriz-energia.module';
import { RecetaNormalizadaModule } from './recetaNormalizada/receta-normalizada.module';
import { SectorProductivoModule } from './sectorProductivo/sectores-productivos.module';
import { ExportModule } from './exportacion/export.module';
import { TablaConfigModule } from './tablaConfig/tabla-config.module';
import { ImportacionModule } from './importacion/importacion.module';

@Module({
  imports: [
    RecetaModule,
    InsumoModule,
    AutocompleteModule,
    ProductoModule,
    ResultadosCdrModule,
    MatrizManoModule,
    MatrizEnergiaModule,
    RecetaNormalizadaModule,
    SectorProductivoModule,
    TablaConfigModule,
    ExportModule,
    ImportacionModule,


  ],
})
export class AppModule { }
