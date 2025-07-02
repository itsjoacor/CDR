import { Injectable } from '@nestjs/common';
import { supabase } from '../config/supabase.client';
import { MatrizEnergia } from './matriz-energia.model';

@Injectable()
export class MatrizEnergiaRepository {
    async obtenerTodos(): Promise<MatrizEnergia[]> {
        const { data, error } = await supabase.from('matriz_energia').select('*');
        if (error) throw new Error(error.message);
        return data as MatrizEnergia[];
    }

    async obtenerPorCodigo(codigo: string): Promise<MatrizEnergia | null> {
        const { data, error } = await supabase
            .from('matriz_energia')
            .select('*')
            .eq('codigo_energia', codigo)
            .maybeSingle();
        if (error) throw new Error(error.message);
        return data as MatrizEnergia | null;
    }

    async crear(data: MatrizEnergia): Promise<MatrizEnergia> {
        try {
            // Eliminar std_produccion para que lo maneje el trigger
            const { std_produccion, ...insertData } = data;

            const { data: insertedData, error } = await supabase
                .from('matriz_energia')
                .insert([insertData])
                .select()
                .single();

            if (error) {
                // Manejo de errores específicos
                if (error.code === '23505') {
                    throw new Error('Código de energía ya existente');
                }
                if (error.code === '23502') {
                    throw new Error('Datos requeridos faltantes');
                }

                // Otro error
                throw new Error(error.message);
            }

            return insertedData;
        } catch (error: any) {
            // Propagar error para que el controller lo transforme
            throw error;
        }
    }

    async actualizar(codigo: string, data: Partial<MatrizEnergia>): Promise<void> {
        const { error } = await supabase
            .from('matriz_energia')
            .update(data)
            .eq('codigo_energia', codigo);  // Changed from codigo_mano_obra
        if (error) throw new Error(error.message);
    }

    async eliminar(codigo: string): Promise<void> {
        const { error } = await supabase
            .from('matriz_energia')
            .delete()
            .eq('codigo_energia', codigo);  // Changed from codigo_mano_obra
        if (error) throw new Error(error.message);
    }
}