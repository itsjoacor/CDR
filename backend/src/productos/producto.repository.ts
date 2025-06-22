// producto.repository.ts
import { Injectable } from '@nestjs/common';
import { supabase } from '../config/supabase.client';
import { Producto } from '../productos/producto.model';

@Injectable()
export class ProductoRepository {
  async crear(producto: Producto): Promise<Producto> {
    const { data, error } = await supabase
      .from('productos')
      .insert([{
        codigo_producto: producto.codigo_producto,
        descripcion_producto: producto.descripcion_producto,
        sector_productivo: producto.sector_productivo
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear producto: ${error.message}`);
    }

    return new Producto(
      data.codigo_producto,
      data.descripcion_producto,
      data.sector_productivo,
      new Date(data.created_at),
      data.updated_at ? new Date(data.updated_at) : undefined
    );
  }

  async obtenerTodos(): Promise<Producto[]> {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('codigo_producto', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener productos: ${error.message}`);
    }

    return data.map(item => new Producto(
      item.codigo_producto,
      item.descripcion_producto,
      item.sector_productivo,
      new Date(item.created_at),
      item.updated_at ? new Date(item.updated_at) : undefined
    ));
  }

  async obtenerPorCodigo(codigo: string): Promise<Producto | null> {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('codigo_producto', codigo)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No results found
        return null;
      }
      throw new Error(`Error al obtener producto: ${error.message}`);
    }

    return new Producto(
      data.codigo_producto,
      data.descripcion_producto,
      data.sector_productivo,
      new Date(data.created_at),
      data.updated_at ? new Date(data.updated_at) : undefined
    );
  }

  async actualizar(codigo: string, producto: Partial<Producto>): Promise<Producto> {
    const { data, error } = await supabase
      .from('productos')
      .update({
        descripcion_producto: producto.descripcion_producto,
        sector_productivo: producto.sector_productivo,
        updated_at: new Date().toISOString()
      })
      .eq('codigo_producto', codigo)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar producto: ${error.message}`);
    }

    return new Producto(
      data.codigo_producto,
      data.descripcion_producto,
      data.sector_productivo,
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }

  async eliminar(codigo: string): Promise<void> {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('codigo_producto', codigo);

    if (error) {
      throw new Error(`Error al eliminar producto: ${error.message}`);
    }
  }
}