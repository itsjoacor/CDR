// sectores-productivos.repository.ts
import { Injectable } from '@nestjs/common';
import { supabase } from '../config/supabase.client';
import { SectorProductivo } from '../sectorProductivo/sectores-productivos.model';

@Injectable()
export class SectorProductivoRepository {
  async crear(sector: SectorProductivo): Promise<SectorProductivo> {
    const { data, error } = await supabase
      .from('sectores_productivos')
      .insert([{ nombre: sector.nombre }])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear sector productivo: ${error.message}`);
    }

    return new SectorProductivo(
      data.nombre,
      new Date(data.created_at),
      data.updated_at ? new Date(data.updated_at) : undefined
    );
  }

  async obtenerTodos(): Promise<SectorProductivo[]> {
    const { data, error } = await supabase
      .from('sectores_productivos')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener sectores productivos: ${error.message}`);
    }

    return data.map(item => new SectorProductivo(
      item.nombre,
      new Date(item.created_at),
      item.updated_at ? new Date(item.updated_at) : undefined
    ));
  }

  async obtenerPorNombre(nombre: string): Promise<SectorProductivo | null> {
    const { data, error } = await supabase
      .from('sectores_productivos')
      .select('*')
      .eq('nombre', nombre)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error al obtener sector productivo: ${error.message}`);
    }

    return new SectorProductivo(
      data.nombre,
      new Date(data.created_at),
      data.updated_at ? new Date(data.updated_at) : undefined
    );
  }
}