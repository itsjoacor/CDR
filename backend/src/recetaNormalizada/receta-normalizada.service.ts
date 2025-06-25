import { Injectable } from '@nestjs/common';
import { RecetaNormalizadaRepository } from './receta-normalizada.repository';
import { CreateRecetaNormalizadaDto } from '../recetaNormalizada/receta-nomralizada.dto';

@Injectable()
export class RecetaNormalizadaService {
  constructor(private readonly repo: RecetaNormalizadaRepository) {}

  async crear(dto: CreateRecetaNormalizadaDto) {
    return this.repo.crear(dto);
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
