import { Injectable, Inject, Scope } from '@nestjs/common';
import { Request } from 'express';
import { MatrizEnergia } from './matriz-energia.model';
import { MatrizEnergiaRepository } from './matiz-energia.repository';

@Injectable({ scope: Scope.REQUEST })
export class MatrizEnergiaService {
  constructor(
    private readonly repo: MatrizEnergiaRepository,
    @Inject('REQUEST') private readonly request: Request
  ) {}

  async crear(matriz: MatrizEnergia): Promise<MatrizEnergia> {
    try {
      return await this.repo.crear(matriz);
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Código de energía ya existente');
      }
      throw new Error('Error al guardar matriz de energía');
    }
  }

  async obtenerTodos(): Promise<MatrizEnergia[]> {
    return this.repo.obtenerTodos();
  }

  async obtenerPorCodigo(codigo: string): Promise<MatrizEnergia> {
    const energia = await this.repo.obtenerPorCodigo(codigo);
    if (!energia) throw new Error('Registro no encontrado');
    return energia;
  }

  async actualizar(id: string, data: Partial<MatrizEnergia>): Promise<MatrizEnergia> {
    await this.repo.actualizar(id, data);

    const codigoActual = data.codigo_energia ?? id;
    const actualizado = await this.repo.obtenerPorCodigo(codigoActual);
    if (!actualizado) throw new Error('Registro no encontrado después de actualizar');

    return actualizado;
  }

  async eliminar(codigo: string): Promise<void> {
    try {
      return await this.repo.eliminar(codigo);
    } catch (error) {
      console.error('[MatrizEnergia][Remove]', error);
      throw new Error('Error al eliminar registro: ' + error.message);
    }
  }
}