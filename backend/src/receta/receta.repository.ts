import { Injectable, Inject, Scope } from '@nestjs/common';
import { Request } from 'express';
import { getSupabaseClient } from '../config/supabase.client';
import { Receta } from './receta.model';

@Injectable({ scope: Scope.REQUEST })
export class RecetaRepository {
  constructor(@Inject('REQUEST') private readonly request: Request) {}

  private async getSupabase() {
    const token = this.request.headers.authorization?.replace('Bearer ', '');
    return getSupabaseClient(token);
  }

  async buscarPorFiltros(filtros: {
    codigo_producto?: string;
    codigo_ingrediente?: string;
    sector_productivo?: string;
  }): Promise<Receta[]> {
    const supabase = await this.getSupabase();
    const condiciones: Record<string, string> = {};

    if (filtros.codigo_producto) condiciones.codigo_producto = filtros.codigo_producto;
    if (filtros.codigo_ingrediente) condiciones.codigo_ingrediente = filtros.codigo_ingrediente;
    if (filtros.sector_productivo) condiciones.sector_productivo = filtros.sector_productivo;

    const { data, error } = await supabase
      .from('recetas')
      .select('*')
      .match(condiciones);

    if (error) {
      throw new Error(`Error al buscar recetas: ${error.message}`);
    }
    return data as Receta[];
  }

  async guardar(receta: Receta): Promise<Receta> {
    const supabase = await this.getSupabase();
    // Primero verificar si ya existe
    const existe = await supabase
      .from('recetas')
      .select('*')
      .eq('codigo_producto', receta.codigo_producto)
      .eq('codigo_ingrediente', receta.codigo_ingrediente)
      .maybeSingle();

    if (existe.data) {
      throw new Error('Ya existe una receta con estos códigos, si deseas actualizar valores, Edita la receta');
    }

    // Si no existe, insertar
    const { data, error } = await supabase
      .from('recetas')
      .insert([{
        sector_productivo: receta.sector_productivo,
        codigo_ingrediente: receta.codigo_ingrediente,
        descripcion_ingrediente: receta.descripcion_ingrediente,
        cantidad_ingrediente: receta.cantidad_ingrediente,
        codigo_producto: receta.codigo_producto,
        descripcion_producto: receta.descripcion_producto
      }])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async buscarProducto(codigo: string) {
    const supabase = await this.getSupabase();
    const { data } = await supabase
      .from('recetas')
      .select('descripcion_producto, sector_productivo')
      .eq('codigo_producto', codigo)
      .limit(1)
      .maybeSingle();

    return data;
  }
}