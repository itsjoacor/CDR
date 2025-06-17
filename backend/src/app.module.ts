import { Module } from '@nestjs/common';
import { RecetaModule } from './receta/receta.module';
import { AutorizacionModule } from './autorizacion/autorizacion.module';

@Module({
  imports: [
    RecetaModule,
    AutorizacionModule
  ],
})
export class AppModule {}
