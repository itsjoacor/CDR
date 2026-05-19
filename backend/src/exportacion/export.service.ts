import { Injectable, Inject, Scope } from '@nestjs/common';
import { Request } from 'express';
import { getSupabaseClient } from '../config/supabase.client';
import { aplicarFiltroPlanta } from '../config/planta.helper';
import * as XLSX from 'xlsx';

@Injectable({ scope: Scope.REQUEST })
export class ExportService {
  constructor(@Inject('REQUEST') private readonly request: Request) {}

  private async getSupabase() {
    const token = this.request.headers.authorization?.replace('Bearer ', '');
    return getSupabaseClient(token);
  }

  /** Para productos: lleva_flete bool → 'SI'/'NO' (formato amigable para Excel). */
  private transformProductos(rows: any[]): any[] {
    return (rows ?? []).map((r) => ({
      ...r,
      lleva_flete: r.lleva_flete === true ? 'SI' : 'NO',
    }));
  }

  /**
   * Headers que espera cada importador / que se ven en el export. Se usan para
   * generar el "molde" (template) cuando la tabla está vacía y no se puede
   * inferir el esquema a partir de los datos.
   */
  private readonly TEMPLATE_HEADERS: Record<string, string[]> = {
    productos:           ['codigo_producto', 'descripcion_producto', 'sector_productivo', 'lleva_flete', 'm3'],
    insumos:             ['grupo', 'codigo', 'detalle', 'costo'],
    insumosutilizados:   ['grupo', 'codigo', 'detalle', 'costo'],
    matriz_mano:         ['sector_productivo', 'codigo_mano_obra', 'descripcion', 'consumo_kw_std', 'std_produccion', 'horas_hombre_std', 'valor_hora_hombre', 'horas_por_turno'],
    matriz_energia:      ['sector_productivo', 'codigo_mano_obra', 'codigo_energia', 'descripcion', 'consumo_kw_std', 'valor_kw', 'std_produccion'],
    recetas_normalizada: ['codigo_producto', 'codigo_ingrediente', 'cantidad_ingrediente'],
    resultados_cdr:      ['codigo_producto', 'sector_productivo', 'descripcion_producto', 'base_cdr', 'base_cdr_final', 'monto_flete', 'valor_cdr_final'],
  };

  /**
   * Genera un archivo "molde" con solo la fila de headers, sin datos.
   * Útil cuando la tabla está vacía y el usuario quiere el formato para llenar.
   */
  exportTemplate(tableName: string, format: 'csv' | 'xlsx'): Buffer | string {
    const headers = this.TEMPLATE_HEADERS[tableName];
    if (!headers) {
      throw new Error(`No hay molde definido para la tabla "${tableName}"`);
    }

    if (format === 'xlsx') {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([headers]);
      XLSX.utils.book_append_sheet(workbook, worksheet, tableName);
      return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    }

    // CSV: solo la fila de headers
    return headers.join(',') + '\n';
  }

  async exportTable(tableName: string, format: 'csv' | 'xlsx', planta?: 'catamarca' | 'varela' | null) {
    const supabase = await this.getSupabase();

    if (tableName === 'recetas_normalizada') {
      const data = await this.buildRecetasExport(supabase, planta);
      if (format === 'xlsx') return this.generateExcel(data, 'recetas_normalizada');
      return this.generateCSV(data);
    }

    let query = supabase.from(tableName).select('*');
    query = aplicarFiltroPlanta(query, planta ?? null);
    const { data, error } = await query;
    if (error) throw new Error(`Supabase error: ${error.message}`);

    const finalData = tableName === 'productos' ? this.transformProductos(data ?? []) : data;

    if (format === 'xlsx') return this.generateExcel(finalData, tableName);
    return this.generateCSV(finalData);
  }

  private async fetchAllRowsRecetas(supabase: any, planta?: 'catamarca' | 'varela' | null): Promise<any[]> {
    const PAGE = 1000;
    let all: any[] = [];
    let from = 0;

    while (true) {
      let query = supabase
        .from('recetas_normalizada')
        .select('codigo_producto, codigo_ingrediente, cantidad_ingrediente, costo_ingrediente, costo_total, valor_cdr, planta, ultima_actualizacion')
        .order('codigo_producto', { ascending: true })
        .range(from, from + PAGE - 1);
      query = aplicarFiltroPlanta(query, planta ?? null);
      const { data, error } = await query;
      if (error) throw new Error(`Error paginando recetas_normalizada: ${error.message}`);
      if (!data || data.length === 0) break;
      all = all.concat(data);
      if (data.length < PAGE) break;
      from += PAGE;
    }

    return all;
  }

  private async buildRecetasExport(supabase: any, planta?: 'catamarca' | 'varela' | null): Promise<any[]> {
    const recetas = await this.fetchAllRowsRecetas(supabase, planta);
    if (!recetas || recetas.length === 0) return [];

    const codigosProducto    = [...new Set(recetas.map((r: any) => r.codigo_producto))];
    const codigosIngrediente = [...new Set(recetas.map((r: any) => r.codigo_ingrediente))];
    const todosCodigos       = [...new Set([...codigosProducto, ...codigosIngrediente])];

    // Lookups paralelos para nombres
    const [prodData, insData, manoData, eneData] = await Promise.all([
      supabase.from('productos').select('codigo_producto, descripcion_producto').in('codigo_producto', todosCodigos),
      supabase.from('insumos').select('codigo, detalle').in('codigo', todosCodigos),
      supabase.from('matriz_mano').select('codigo_mano_obra, descripcion').in('codigo_mano_obra', todosCodigos),
      supabase.from('matriz_energia').select('codigo_energia, descripcion').in('codigo_energia', todosCodigos),
    ]);

    const nombres: Record<string, string> = {};
    eneData.data?.forEach((r: any)  => { nombres[r.codigo_energia]   = r.descripcion; });
    manoData.data?.forEach((r: any) => { nombres[r.codigo_mano_obra] = r.descripcion; });
    insData.data?.forEach((r: any)  => { nombres[r.codigo]           = r.detalle; });
    prodData.data?.forEach((r: any) => { nombres[r.codigo_producto]  = r.descripcion_producto; });

    return recetas.map((r: any) => ({
      planta:               r.planta ?? 'catamarca',
      codigo_producto:      r.codigo_producto,
      nombre_producto:      nombres[r.codigo_producto]    ?? '',
      codigo_ingrediente:   r.codigo_ingrediente,
      nombre_ingrediente:   nombres[r.codigo_ingrediente] ?? '',
      cantidad_ingrediente: r.cantidad_ingrediente,
      costo_ingrediente:    r.costo_ingrediente,
      costo_total:          r.costo_total,
      valor_cdr:            r.valor_cdr,
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

  async exportMultipleTables(tables: string[], planta?: 'catamarca' | 'varela' | null) {
    const supabase = await this.getSupabase();
    const workbook = XLSX.utils.book_new();

    const results = await Promise.all(
      tables.map(async (table) => {
        if (table === 'recetas_normalizada') return this.buildRecetasExport(supabase, planta);
        let query = supabase.from(table).select('*');
        query = aplicarFiltroPlanta(query, planta ?? null);
        const r = await query;
        return r.data ?? [];
      })
    );

    tables.forEach((table, i) => {
      const rows = table === 'productos' ? this.transformProductos(results[i] ?? []) : (results[i] ?? []);
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, table);
    });

    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  }
}
