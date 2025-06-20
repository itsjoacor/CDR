import { Injectable } from '@nestjs/common';
import { supabase } from '../../config/supabase.client';
import { Receta } from '../model/receta.model';

@Injectable()
export class RecetaRepository {
  [x: string]: any;
  async buscarPorFiltros(filtros: {
    codigo_producto?: string;
    codigo_ingrediente?: string;
    sector_productivo?: string;
  }): Promise<Receta[]> {
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
  // Primero verificar si ya existe
  const existe = await supabase
    .from('recetas')
    .select('*')
    .eq('codigo_producto', receta.codigo_producto)
    .eq('codigo_ingrediente', receta.codigo_ingrediente)
    .maybeSingle();

  if (existe.data) {
    throw new Error('Ya existe una receta con estos códigos, si deseasa actualizar valores, Edita la receta');
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
    const { data } = await supabase
      .from('recetas')
      .select('descripcion_producto, sector_productivo')
      .eq('codigo_producto', codigo)
      .limit(1)
      .maybeSingle();

    return data;
  }

}