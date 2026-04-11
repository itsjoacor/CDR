import { Injectable, Inject, Scope } from '@nestjs/common';
import { Request } from 'express';
import { getSupabaseClient } from '../config/supabase.client';
import * as XLSX from 'xlsx';

@Injectable({ scope: Scope.REQUEST })
export class ExportService {
  constructor(@Inject('REQUEST') private readonly request: Request) {}

  private async getSupabase() {
    const token = this.request.headers.authorization?.replace('Bearer ', '');
    return getSupabaseClient(token);
  }

  async exportTable(tableName: string, format: 'csv' | 'xlsx') {
    const supabase = await this.getSupabase();

    if (tableName === 'recetas_normalizada') {
      const data = await this.buildRecetasExport(supabase);
      if (format === 'xlsx') return this.generateExcel(data, 'recetas_normalizada');
      return this.generateCSV(data);
    }

    const { data, error } = await supabase.from(tableName).select('*');
    if (error) throw new Error(`Supabase error: ${error.message}`);

    if (format === 'xlsx') return this.generateExcel(data, tableName);
    return this.generateCSV(data);
  }

  private async buildRecetasExport(supabase: any): Promise<any[]> {
    // 1. Traer recetas con todos los campos necesarios
    const { data: recetas, error } = await supabase
      .from('recetas_normalizada')
      .select('codigo_producto, codigo_ingrediente, cantidad_ingrediente, costo_ingrediente, costo_total, valor_cdr, ultima_actualizacion')
      .order('codigo_producto', { ascending: true });

    if (error) throw new Error(`Error recetas: ${error.message}`);
    if (!recetas || recetas.length === 0) return [];

    // 2. Obtener códigos únicos
    const codigosProducto  = [...new Set(recetas.map((r: any) => r.codigo_producto))];
    const codigosIngrediente = [...new Set(recetas.map((r: any) => r.codigo_ingrediente))];
    const todosCodigos = [...new Set([...codigosProducto, ...codigosIngrediente])];

    // 3. Buscar nombres en las 4 tablas en paralelo
    const [prodData, insData, manoData, eneData] = await Promise.all([
      supabase.from('productos').select('codigo_producto, descripcion_producto').in('codigo_producto', todosCodigos),
      supabase.from('insumos').select('codigo, detalle').in('codigo', todosCodigos),
      supabase.from('matriz_mano').select('codigo_mano_obra, descripcion').in('codigo_mano_obra', todosCodigos),
      supabase.from('matriz_energia').select('codigo_energia, descripcion').in('codigo_energia', todosCodigos),
    ]);

    // 4. Construir mapa codigo -> nombre (prioridad: productos > insumos > mano > energía)
    const nombres: Record<string, string> = {};
    eneData.data?.forEach((r: any)  => { nombres[r.codigo_energia]   = r.descripcion; });
    manoData.data?.forEach((r: any) => { nombres[r.codigo_mano_obra] = r.descripcion; });
    insData.data?.forEach((r: any)  => { nombres[r.codigo]           = r.detalle; });
    prodData.data?.forEach((r: any) => { nombres[r.codigo_producto]  = r.descripcion_producto; });

    // 5. Armar filas con columnas ordenadas
    return recetas.map((r: any) => ({
      codigo_producto:     r.codigo_producto,
      nombre_producto:     nombres[r.codigo_producto]    ?? '',
      codigo_ingrediente:  r.codigo_ingrediente,
      nombre_ingrediente:  nombres[r.codigo_ingrediente] ?? '',
      cantidad_ingrediente: r.cantidad_ingrediente,
      costo_ingrediente:   r.costo_ingrediente,
      costo_total:         r.costo_total,
      valor_cdr:           r.valor_cdr,
      ultima_actualizacion: r.ultima_actualizacion,
    }));
  }

  private generateExcel(data: any[], tableName: string) {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, tableName);
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  }

  private generateCSV(data: any[]) {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]).join(',') + '\n';
    const rows = data.map(row =>
      Object.values(row).map(value =>
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    ).join('\n');

    return headers + rows;
  }

  async exportMultipleTables(tables: string[]) {
    const supabase = await this.getSupabase();
    const workbook = XLSX.utils.book_new();

    const results = await Promise.all(
      tables.map(table => {
        if (table === 'recetas_normalizada') return this.buildRecetasExport(supabase);
        return supabase.from(table).select('*').then((r: any) => r.data ?? []);
      })
    );

    tables.forEach((table, i) => {
      const worksheet = XLSX.utils.json_to_sheet(results[i] ?? []);
      XLSX.utils.book_append_sheet(workbook, worksheet, table);
    });

    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  }
}