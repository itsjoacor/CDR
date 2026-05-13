import { Injectable, Inject, Scope } from '@nestjs/common';
import { Request } from 'express';
import { Producto } from '../productos/producto.model';
import { ProductoRepository } from '../productos/producto.repository';
import { PlantasService } from '../plantas/plantas.service';

@Injectable({ scope: Scope.REQUEST })
export class ProductoService {
  constructor(
    private readonly productoRepository: ProductoRepository,
    private readonly plantasService: PlantasService,
    @Inject('REQUEST') private readonly request: Request
  ) {}

  async crear(producto: Producto): Promise<Producto> {
    const existe = await this.productoRepository.obtenerPorCodigo(producto.codigo_producto);
    if (existe) {
      throw new Error('Ya existe un producto con este código');
    }
    const creado = await this.productoRepository.crear(producto);
    // Si nace con flete=true, recalcular su CDR final
    if (creado.lleva_flete) {
      await this.plantasService.recalcularFleteDeProducto(creado.codigo_producto);
    }
    return creado;
  }

  async obtenerTodos(planta?: 'catamarca' | 'varela' | null): Promise<Producto[]> {
    return this.productoRepository.obtenerTodos(planta);
  }

  async obtenerPorCodigo(codigo: string): Promise<Producto | null> {
    return this.productoRepository.obtenerPorCodigo(codigo);
  }

  async actualizar(codigo: string, producto: Partial<Producto>): Promise<Producto> {
    const antes = await this.productoRepository.obtenerPorCodigo(codigo);
    const actualizado = await this.productoRepository.actualizar(codigo, producto);

    // Si cambió lleva_flete o planta → recalcular flete del producto
    const cambioFlete = antes && (
      antes.lleva_flete !== actualizado.lleva_flete ||
      antes.planta !== actualizado.planta
    );
    if (cambioFlete) {
      await this.plantasService.recalcularFleteDeProducto(codigo);
    }

    return actualizado;
  }

  async eliminar(codigo: string): Promise<void> {
    return this.productoRepository.eliminar(codigo);
  }

  async obtenerTodosConEstado(planta?: 'catamarca' | 'varela' | null) {
    return this.productoRepository.obtenerTodosConEstado(planta);
  }
}
