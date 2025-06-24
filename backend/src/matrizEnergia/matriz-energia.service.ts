import { Injectable } from '@nestjs/common';
import { MatrizEnergia } from './matriz-energia.model';
import { MatrizEnergiaRepository } from './matiz-energia.repository';

@Injectable()
export class MatrizEnergiaService {
    constructor(private readonly repo: MatrizEnergiaRepository) { }

    async crear(data: MatrizEnergia): Promise<MatrizEnergia> {
        const existente = await this.repo.obtenerPorCodigo(data.codigo_mano_obra);
        if (existente) {
            throw new Error('Ya existe un registro con ese código de mano de obra.');
        }
        return this.repo.crear(data);
    }

    async obtenerTodos(): Promise<MatrizEnergia[]> {
        return this.repo.obtenerTodos();
    }

    async obtenerPorCodigo(codigo: string): Promise<MatrizEnergia> {
        const energia = await this.repo.obtenerPorCodigo(codigo);
        if (!energia) throw new Error('Registro no encontrado');
        return energia;
    }

    async actualizar(codigo: string, data: Partial<MatrizEnergia>): Promise<MatrizEnergia> {
        await this.repo.actualizar(codigo, data);
        const actualizado = await this.repo.obtenerPorCodigo(codigo);
        if (!actualizado) throw new Error('Registro no encontrado después de actualizar');
        return actualizado;
    }

    async eliminar(codigo: string): Promise<void> {
        return this.repo.eliminar(codigo);
    }
}
