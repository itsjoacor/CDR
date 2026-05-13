import { Injectable, Inject, Scope, BadRequestException, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { getSupabaseClient } from '../config/supabase.client';

export type PlantaNombre = 'catamarca' | 'varela';
export const PLANTAS_VALIDAS: PlantaNombre[] = ['catamarca', 'varela'];

export interface Planta {
  nombre: PlantaNombre;
  porcentaje_flete: number;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ scope: Scope.REQUEST })
export class PlantasService {
  constructor(@Inject('REQUEST') private readonly request: Request) {}

  private async getSupabase() {
    const token = this.request.headers.authorization?.replace('Bearer ', '');
    return getSupabaseClient(token);
  }

  /** Listar todas las plantas con sus porcentajes de flete actuales. */
  async listar(): Promise<Planta[]> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('plantas')
      .select('*')
      .order('nombre', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  /** Obtener una planta puntual. */
  async obtener(nombre: PlantaNombre): Promise<Planta> {
    if (!PLANTAS_VALIDAS.includes(nombre)) {
      throw new BadRequestException(`Planta inválida: ${nombre}`);
    }
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('plantas')
      .select('*')
      .eq('nombre', nombre)
      .single();
    if (error || !data) throw new NotFoundException(`Planta ${nombre} no encontrada`);
    return data;
  }

  /**
   * Actualizar % flete de una planta.
   * Después dispara recálculo de valor_cdr_final de productos con lleva_flete=true.
   */
  async actualizarFlete(nombre: PlantaNombre, porcentaje_flete: number): Promise<Planta> {
    if (!PLANTAS_VALIDAS.includes(nombre)) {
      throw new BadRequestException(`Planta inválida: ${nombre}`);
    }
    if (porcentaje_flete < 0 || porcentaje_flete > 100) {
      throw new BadRequestException('porcentaje_flete debe estar entre 0 y 100');
    }
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('plantas')
      .update({
        porcentaje_flete,
        updated_at: new Date().toISOString(),
      })
      .eq('nombre', nombre)
      .select()
      .single();
    if (error) throw new Error(`Error actualizando flete: ${error.message}`);

    // Disparar recálculo de valor_cdr_final para productos de esa planta con flete
    await this.recalcularFletesDeProductos(nombre, porcentaje_flete);

    return data;
  }

  /**
   * Recalcula `monto_flete` y `valor_cdr_final` para TODOS los productos de
   * una planta que tienen `lleva_flete = true`.
   * Llamado tras un cambio de % flete o de la flag `lleva_flete` de un producto.
   */
  async recalcularFletesDeProductos(planta: PlantaNombre, porcentaje?: number): Promise<{ actualizados: number }> {
    const supabase = await this.getSupabase();

    const pct = porcentaje ?? (await this.obtener(planta)).porcentaje_flete;
    const factor = Number(pct) / 100;

    // Productos de esa planta con lleva_flete = true
    const { data: productos, error: errProd } = await supabase
      .from('productos')
      .select('codigo_producto')
      .eq('planta', planta)
      .eq('lleva_flete', true);
    if (errProd) throw new Error(`Error listando productos: ${errProd.message}`);

    const codigos = (productos ?? []).map((p: any) => p.codigo_producto);
    if (!codigos.length) return { actualizados: 0 };

    // Traer base_cdr (sin flete, con mantención) para cada producto
    const { data: cdrs, error: errCdr } = await supabase
      .from('resultados_cdr')
      .select('codigo_producto, base_cdr, base_cdr_final')
      .in('codigo_producto', codigos);
    if (errCdr) throw new Error(`Error listando resultados_cdr: ${errCdr.message}`);

    // Calcular nuevos valores y hacer upsert
    const updates = (cdrs ?? []).map((r: any) => {
      const baseConMantencion = Number(r.base_cdr_final ?? r.base_cdr ?? 0);
      const monto_flete = baseConMantencion * factor;
      const valor_cdr_final = baseConMantencion + monto_flete;
      return {
        codigo_producto: r.codigo_producto,
        monto_flete,
        valor_cdr_final,
      };
    });

    // Update por batches
    const BATCH = 200;
    let actualizados = 0;
    for (let i = 0; i < updates.length; i += BATCH) {
      const slice = updates.slice(i, i + BATCH);
      for (const u of slice) {
        const { error } = await supabase
          .from('resultados_cdr')
          .update({ monto_flete: u.monto_flete, valor_cdr_final: u.valor_cdr_final })
          .eq('codigo_producto', u.codigo_producto);
        if (!error) actualizados++;
      }
    }

    return { actualizados };
  }

  /**
   * Recalcula valor_cdr_final de UN producto puntual.
   * Llamado cuando cambia lleva_flete o planta de ese producto.
   */
  async recalcularFleteDeProducto(codigo_producto: string): Promise<void> {
    const supabase = await this.getSupabase();

    const { data: prod, error: errProd } = await supabase
      .from('productos')
      .select('codigo_producto, planta, lleva_flete')
      .eq('codigo_producto', codigo_producto)
      .single();
    if (errProd || !prod) return;

    const { data: cdr } = await supabase
      .from('resultados_cdr')
      .select('base_cdr, base_cdr_final')
      .eq('codigo_producto', codigo_producto)
      .single();
    if (!cdr) return;

    const baseConMantencion = Number((cdr as any).base_cdr_final ?? (cdr as any).base_cdr ?? 0);

    let monto_flete = 0;
    if ((prod as any).lleva_flete) {
      const planta = await this.obtener((prod as any).planta);
      monto_flete = baseConMantencion * (Number(planta.porcentaje_flete) / 100);
    }
    const valor_cdr_final = baseConMantencion + monto_flete;

    await supabase
      .from('resultados_cdr')
      .update({ monto_flete, valor_cdr_final })
      .eq('codigo_producto', codigo_producto);
  }
}
