// producto.module.ts
import { Module } from '@nestjs/common';
import { ProductoController } from '../productos/producto.controller';
import { ProductoService } from '../productos/producto.service';
import { ProductoRepository } from '../productos/producto.repository';
import { PlantasModule } from '../plantas/plantas.module';

@Module({
  imports: [PlantasModule],
  controllers: [ProductoController],
  providers: [ProductoService, ProductoRepository],
  exports: [ProductoService]
})
export class ProductoModule {}
