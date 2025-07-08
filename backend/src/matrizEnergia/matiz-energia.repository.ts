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

    // Add to MatrizEnergiaRepository class

    async updateDefaultValorKw(newValue: number): Promise<{ updatedRecords: number }> {
        // Update the table's default value
        const { error: alterError } = await supabase.rpc('alter_table_set_default', {
            table_name: 'matriz_energia',
            column_name: 'valor_kw',
            default_value: newValue
        });

        if (alterError) throw new Error(alterError.message);

        // Update ALL records (no filtering by current default)
        const { data, error: updateError, count } = await supabase
            .from('matriz_energia')
            .update({ valor_kw: newValue }, { count: 'exact' });

        if (updateError) throw new Error(updateError.message);

        return { updatedRecords: count || 0 };
    }

    async getCurrentDefaultValorKw(): Promise<number> {
        // Consulta directa a information_schema.columns
        const { data, error } = await supabase
            .from('information_schema.columns')
            .select('column_default')
            .eq('table_name', 'matriz_energia')
            .eq('column_name', 'valor_kw')
            .eq('table_schema', 'public')
            .single();

        if (error) {
            throw new Error(`Error al obtener valor por defecto: ${error.message}`);
        }

        if (!data?.column_default) {
            return 89.40; // Valor por defecto inicial
        }

        // Extraer el valor numérico del string (ej: "89.40::numeric")
        const defaultValue = parseFloat(data.column_default.split('::')[0].replace(/"/g, ''));
        return defaultValue;
    }

}