import { Injectable, Inject, Scope } from '@nestjs/common';
import { Request } from 'express';
import { Producto } from '../productos/producto.model';
import { ProductoRepository } from '../productos/producto.repository';

@Injectable({ scope: Scope.REQUEST })
export class ProductoService {
  constructor(
    private readonly productoRepository: ProductoRepository,
    @Inject('REQUEST') private readonly request: Request
  ) {}

  async crear(producto: Producto): Promise<Producto> {
    const existe = await this.productoRepository.obtenerPorCodigo(producto.codigo_producto);
    if (existe) {
      throw new Error('Ya existe un producto con este código');
    }
    return this.productoRepository.crear(producto);
  }

  async obtenerTodos(): Promise<Producto[]> {
    return this.productoRepository.obtenerTodos();
  }

  async obtenerPorCodigo(codigo: string): Promise<Producto | null> {
    return this.productoRepository.obtenerPorCodigo(codigo);
  }

  async actualizar(codigo: string, producto: Partial<Producto>): Promise<Producto> {
    return this.productoRepository.actualizar(codigo, producto);
  }

  async eliminar(codigo: string): Promise<void> {
    return this.productoRepository.eliminar(codigo);
  }

  async obtenerTodosConEstado() {
    return this.productoRepository.obtenerTodosConEstado();
  }
}