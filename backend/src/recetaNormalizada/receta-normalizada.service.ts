import { Injectable } from '@nestjs/common';
import { RecetaNormalizadaRepository } from './receta-normalizada.repository';
import { CreateRecetaNormalizadaDto } from '../recetaNormalizada/receta-nomralizada.dto';

@Injectable()
export class RecetaNormalizadaService {
  constructor(private readonly repo: RecetaNormalizadaRepository) { }

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

  async actualizar(dto: CreateRecetaNormalizadaDto) {
    return this.repo.actualizar(
      dto.codigo_producto,
      dto.codigo_ingrediente,
      dto.cantidad_ingrediente
    );
  }
}
