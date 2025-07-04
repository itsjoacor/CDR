// src/export/export.controller.ts
import { Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ExportService } from './export.service';
import { Response } from 'express';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get()
  async exportTable(
    @Query('table') table: string,
    @Query('format') format: 'csv' | 'xlsx' = 'xlsx',
    @Res() res: Response
  ) {
    if (!table) {
      return res.status(400).json({ error: 'Table name is required' });
    }

    try {
      if (format === 'xlsx') {
        const buffer = await this.exportService.exportTable(table, format);
        res.setHeader('Content-Disposition', `attachment; filename=${table}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(buffer);
      } else {
        const csv = await this.exportService.exportTable(table, format);
        res.setHeader('Content-Disposition', `attachment; filename=${table}.csv`);
        res.setHeader('Content-Type', 'text/csv');
        return res.send(csv);
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  @Post('all')
  async exportAllTables(@Res() res: Response) {
    try {
      const tables = [
        'productos',
        'insumos',
        'matriz_mano',
        'matriz_energia',
        'resultados_cdr',
        'recetas_normalizada'
      ];
      
      const buffer = await this.exportService.exportMultipleTables(tables);
      res.setHeader('Content-Disposition', 'attachment; filename=exportacion_completa.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buffer);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}