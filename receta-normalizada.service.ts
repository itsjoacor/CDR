import { Injectable, Inject, Scope } from '@nestjs/common';
import { Request } from 'express';
import { RecetaNormalizadaRepository } from './receta-normalizada.repository';
import { CreateRecetaNormalizadaDto } from './receta-nomralizada.dto';

@Injectable({ scope: Scope.REQUEST })
export class RecetaNormalizadaService {
  constructor(
    private readonly repo: RecetaNormalizadaRepository,
    @Inject('REQUEST') private readonly request: Request
  ) { }

  async crear(dto: CreateRecetaNormalizadaDto) {
    try {
      const resultado = await this.repo.crear(dto);
      return {
        success: true,
        message: resultado.message,
        data: resultado.data
      };
    } catch (error) {
      return {
        success: false,
        message: error?.message || 'Error creando receta',
        error,
      };
    }
  }

  async obtenerTodas() {
    return this.repo.obtenerTodas();
  }

  async obtenerPorProducto(codigo_producto: string) {
    return this.repo.obtenerPorProducto(codigo_producto);
  }

  async productosConCostoTotalCero(codigo?: string) {
    return this.repo.productosConCostoTotalCero(codigo);
  }

  async productosConCdrCero() {
    return this.repo.productosConCdrCero();
  }

  async eliminar(codigo_producto: string, codigo_ingrediente: string) {
    return this.repo.eliminar(codigo_producto, codigo_ingrediente);
  }

  async eliminarRecetaCompleta(codigo_producto: string) {
    const affected = await this.repo.eliminarPorProducto(codigo_producto);
    return { affected };
  }

  async actualizarPorIds(
    codigo_producto: string,
    codigo_ingrediente: string,
    cantidad_ingrediente: number,
  ) {
    return this.repo.actualizar(
      codigo_producto,
      codigo_ingrediente,
      cantidad_ingrediente,
    );
  }

  // receta-normalizada.service.ts - Agregar este método
  async tieneValorCdrCero(codigo_producto: string) {
    try {
      const resultado = await this.repo.tieneValorCdrCero(codigo_producto);
      return {
        success: true,
        tieneCdrCero: resultado,
        message: resultado ? 'Tiene CDR en cero' : 'No tiene CDR en cero'
      };
    } catch (error) {
      return {
        success: false,
        tieneCdrCero: false,
        message: error.message || 'Error al verificar CDR cero'
      };
    }
  }
}
