import { Injectable, Inject, Scope } from '@nestjs/common';
import { Request } from 'express';
import { MatrizMano } from './matriz-mano.model';
import { MatrizManoRepository } from './matiz-mano.repository';

@Injectable({ scope: Scope.REQUEST })
export class MatrizManoService {
  constructor(
    private readonly matrizManoRepository: MatrizManoRepository,
    @Inject('REQUEST') private readonly request: Request
  ) {}

  async crear(matriz: MatrizMano): Promise<MatrizMano> {
    const existente = await this.matrizManoRepository.obtenerPorCodigo(matriz.codigo_mano_obra);
    if (existente) {
      throw new Error('Ya existe un registro con este código de mano de obra');
    }
    return this.matrizManoRepository.crear(matriz);
  }

  async obtenerTodos(): Promise<MatrizMano[]> {
    return this.matrizManoRepository.obtenerTodos();
  }

  async obtenerPorCodigo(codigo: string): Promise<MatrizMano | null> {
    return this.matrizManoRepository.obtenerPorCodigo(codigo);
  }

  async actualizar(codigo: string, matriz: Partial<MatrizMano>): Promise<MatrizMano> {
    await this.matrizManoRepository.actualizar(codigo, matriz);
    const actualizado = await this.matrizManoRepository.obtenerPorCodigo(codigo);
    if (!actualizado) {
      throw new Error('Registro no encontrado después de actualizar');
    }
    return actualizado;
  }

  async eliminar(codigo: string): Promise<void> {
    return this.matrizManoRepository.eliminar(codigo);
  }

  async obtenerTodosLosCodigos(): Promise<string[]> {
    return await this.matrizManoRepository.obtenerTodosLosCodigos();
  }
}