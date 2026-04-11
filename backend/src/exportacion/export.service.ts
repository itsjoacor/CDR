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
    const { data, error } = await supabase
      .from(tableName)
      .select('*');

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (format === 'xlsx') {
      return this.generateExcel(data, tableName);
    } else {
      return this.generateCSV(data);
    }
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
      tables.map(table => supabase.from(table).select('*'))
    );

    tables.forEach((table, i) => {
      const worksheet = XLSX.utils.json_to_sheet(results[i].data ?? []);
      XLSX.utils.book_append_sheet(workbook, worksheet, table);
    });

    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  }
}