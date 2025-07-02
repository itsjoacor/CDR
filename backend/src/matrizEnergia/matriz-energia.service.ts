import { Injectable } from '@nestjs/common';
import { MatrizEnergia } from './matriz-energia.model';
import { MatrizEnergiaRepository } from './matiz-energia.repository';

@Injectable()
export class MatrizEnergiaService {
    constructor(private readonly repo: MatrizEnergiaRepository) { }

    async crear(matriz: MatrizEnergia): Promise<MatrizEnergia> {
        try {
            return await this.repo.crear(matriz);
        } catch (error) {
            if (error.code === '23505') {
                throw new Error('Código de energía ya existente'); // ⬅️ Este mensaje lo verá el controller
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