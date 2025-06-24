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
            .eq('codigo_mano_obra', codigo)
            .maybeSingle();
        if (error) throw new Error(error.message);
        return data as MatrizEnergia | null;
    }

    async crear(data: MatrizEnergia): Promise<MatrizEnergia> {
        const { error } = await supabase.from('matriz_energia').insert([data]);
        if (error) throw new Error(error.message);
        return data;
    }

    async actualizar(codigo: string, data: Partial<MatrizEnergia>): Promise<void> {
        const { error } = await supabase
            .from('matriz_energia')
            .update(data)
            .eq('codigo_mano_obra', codigo);
        if (error) throw new Error(error.message);
    }

    async eliminar(codigo: string): Promise<void> {
        const { error } = await supabase
            .from('matriz_energia')
            .delete()
            .eq('codigo_mano_obra', codigo);
        if (error) throw new Error(error.message);
    }
}
