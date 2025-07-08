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

    async actualizar(id: string, data: Partial<MatrizEnergia>): Promise<MatrizEnergia> {
        await this.repo.actualizar(id, data);

        const codigoActual = data.codigo_energia ?? id;

        const actualizado = await this.repo.obtenerPorCodigo(codigoActual);
        if (!actualizado) throw new Error('Registro no encontrado después de actualizar');

        return actualizado;
    }


    async eliminar(codigo: string): Promise<void> {
        return this.repo.eliminar(codigo);
    }

    // Add to MatrizEnergiaService class

    async updateDefaultValorKw(newValue: number): Promise<{
        message: string,
        updatedRecords: number
    }> {
        if (newValue <= 0) {
            throw new Error('El valor debe ser mayor que cero');
        }

        const { updatedRecords } = await this.repo.updateDefaultValorKw(newValue);

        return {
            message: 'Valor por defecto y registros actualizados correctamente',
            updatedRecords
        };
    }

    async getDefaultValorKw(): Promise<number> {
        try {
            return await this.repo.getCurrentDefaultValorKw();
        } catch (error) {
            console.error('Error en servicio al obtener valor_kw:', error);
            throw new Error('No se pudo obtener el valor por defecto');
        }
    }

}