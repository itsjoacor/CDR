// producto.module.ts
import { Module } from '@nestjs/common';
import { ProductoController } from '../productos/producto.controller';
import { ProductoService } from '../productos/producto.service';
import { ProductoRepository } from '../productos/producto.repository';

@Module({
  controllers: [ProductoController],
  providers: [ProductoService, ProductoRepository],
  exports: [ProductoService] // Export if needed by other modules
})
export class ProductoModule {}