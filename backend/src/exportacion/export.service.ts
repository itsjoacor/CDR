// src/export/export.service.ts
import { Injectable } from '@nestjs/common';
import { supabase } from '../config/supabase.client';
import * as XLSX from 'xlsx';

@Injectable()
export class ExportService {


  async exportTable(tableName: string, format: 'csv' | 'xlsx') {
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
    const workbook = XLSX.utils.book_new();

    for (const table of tables) {
      const { data } = await supabase
        .from(table)
        .select('*');

      const worksheet = XLSX.utils.json_to_sheet(data ?? []);
      XLSX.utils.book_append_sheet(workbook, worksheet, table);
    }

    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  }
}