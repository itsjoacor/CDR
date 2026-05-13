import { Injectable, Inject, Scope } from '@nestjs/common';
import { Request } from 'express';
import { getSupabaseClient } from '../config/supabase.client';
import { aplicarFiltroPlanta } from '../config/planta.helper';
import { Producto } from '../productos/producto.model';

@Injectable({ scope: Scope.REQUEST })
export class ProductoRepository {
  constructor(@Inject('REQUEST') private readonly request: Request) {}

  private async getSupabase() {
    const token = this.request.headers.authorization?.replace('Bearer ', '');
    return getSupabaseClient(token);
  }

  private mapRow(row: any): Producto {
    return new Producto(
      row.codigo_producto,
      row.descripcion_producto,
      row.sector_productivo,
      row.planta ?? 'catamarca',
      row.lleva_flete ?? false,
      row.created_at ? new Date(row.created_at) : undefined,
      row.updated_at ? new Date(row.updated_at) : undefined,
    );
  }

  async crear(producto: Producto): Promise<Producto> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('productos')
      .insert([{
        codigo_producto: producto.codigo_producto,
        descripcion_producto: producto.descripcion_producto,
        sector_productivo: producto.sector_productivo,
        planta: producto.planta ?? 'catamarca',
        lleva_flete: producto.lleva_flete ?? false,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear producto: ${error.message}`);
    }

    return this.mapRow(data);
  }

  async obtenerTodos(planta?: 'catamarca' | 'varela' | null): Promise<Producto[]> {
    const supabase = await this.getSupabase();
    let query = supabase
      .from('productos')
      .select('*')
      .order('codigo_producto', { ascending: true });
    query = aplicarFiltroPlanta(query, planta ?? null);
    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener productos: ${error.message}`);
    }

    return (data ?? []).map((item: any) => this.mapRow(item));
  }

  async obtenerPorCodigo(codigo: string): Promise<Producto | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('codigo_producto', codigo)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error al obtener producto: ${error.message}`);
    }

    return this.mapRow(data);
  }

  async actualizar(codigo: string, producto: Partial<Producto>): Promise<Producto> {
    const supabase = await this.getSupabase();
    const update: any = {
      updated_at: new Date().toISOString(),
    };
    if (producto.descripcion_producto !== undefined) update.descripcion_producto = producto.descripcion_producto;
    if (producto.sector_productivo !== undefined) update.sector_productivo = producto.sector_productivo;
    if (producto.planta !== undefined) update.planta = producto.planta;
    if (producto.lleva_flete !== undefined) update.lleva_flete = producto.lleva_flete;

    const { data, error } = await supabase
      .from('productos')
      .update(update)
      .eq('codigo_producto', codigo)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar producto: ${error.message}`);
    }

    return this.mapRow(data);
  }

  async obtenerTodosConEstado(planta?: 'catamarca' | 'varela' | null): Promise<any[]> {
    const supabase = await this.getSupabase();

    // Round 1 paralelo: productos (con filtro) + flags de costo cero
    let prodQuery = supabase.from('productos').select('*').order('codigo_producto', { ascending: true });
    prodQuery = aplicarFiltroPlanta(prodQuery, planta ?? null);

    const [productosResult, zeroCostResult] = await Promise.all([
      prodQuery,
      supabase.from('recetas_normalizada').select('codigo_producto').or('costo_total.eq.0,costo_total.is.null'),
    ]);

    if (productosResult.error) throw new Error(productosResult.error.message);
    if (zeroCostResult.error) throw new Error(zeroCostResult.error.message);

    const productos = productosResult.data ?? [];
    const zeroCostSet = new Set((zeroCostResult.data ?? []).map((r: any) => r.codigo_producto));

    // Round 2 paralelo: CDR cero para todos los productos
    const cdrResults = await Promise.all(
      productos.map(async (p: any) => {
        const { data, error } = await supabase.rpc('tiene_valor_cdr_cero', { p_codigo_producto: p.codigo_producto });
        return { codigo: p.codigo_producto, value: error ? false : (data || false) };
      })
    );
    const cdrMap = Object.fromEntries(cdrResults.map(r => [r.codigo, r.value]));

    return productos.map((item: any) => ({
      codigo_producto:      item.codigo_producto,
      descripcion_producto: item.descripcion_producto,
      sector_productivo:    item.sector_productivo,
      planta:               item.planta ?? 'catamarca',
      lleva_flete:          item.lleva_flete ?? false,
      updated_at:           item.updated_at ?? null,
      tiene_costo_cero:     zeroCostSet.has(item.codigo_producto),
      tiene_cdr_cero:       cdrMap[item.codigo_producto] ?? false,
    }));
  }

  async eliminar(codigo: string): Promise<void> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('codigo_producto', codigo);

    if (error) {
      throw new Error(`Error al eliminar producto: ${error.message}`);
    }
  }
}
