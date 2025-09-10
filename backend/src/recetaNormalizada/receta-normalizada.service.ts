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
        data: resultado,
        message: 'Receta creada exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error al crear la receta',
        error: error.response || error
      };
    }
  }

  async obtenerTodas() {
    return this.repo.obtenerTodas();
  }

  async eliminar(codigo_producto: string, codigo_ingrediente: string) {
    return this.repo.eliminar(codigo_producto, codigo_ingrediente);
  }
  async eliminarRecetaCompleta(codigo_producto: string) {
    return this.repo.eliminarRecetaCompleta(codigo_producto);
  }

  async actualizar(dto: CreateRecetaNormalizadaDto) {
    return this.repo.actualizar(
      dto.codigo_producto,
      dto.codigo_ingrediente,
      dto.cantidad_ingrediente
    );
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

}