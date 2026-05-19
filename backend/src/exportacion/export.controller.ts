import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ExportService } from './export.service';
import { Response } from 'express';
import { normalizarPlanta } from '../config/planta.helper';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  /** GET /export?table=insumos&format=xlsx&planta=catamarca|varela|all&template=true */
  @Get()
  async exportTable(
    @Query('table') table: string,
    @Query('format') format: 'csv' | 'xlsx' = 'xlsx',
    @Query('planta') planta: string | undefined,
    @Query('template') template: string | undefined,
    @Res() res: Response,
  ) {
    if (!table) {
      return res.status(400).json({ error: 'Table name is required' });
    }
    const plantaNorm = normalizarPlanta(planta);
    const suffix = plantaNorm ? `_${plantaNorm}` : '';
    const isTemplate = template === 'true' || template === '1';
    const fileSuffix = isTemplate ? '_molde' : suffix;

    try {
      if (isTemplate) {
        const buffer = this.exportService.exportTemplate(table, format);
        if (format === 'xlsx') {
          res.setHeader('Content-Disposition', `attachment; filename=${table}${fileSuffix}.xlsx`);
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        } else {
          res.setHeader('Content-Disposition', `attachment; filename=${table}${fileSuffix}.csv`);
          res.setHeader('Content-Type', 'text/csv');
        }
        return res.send(buffer);
      }

      if (format === 'xlsx') {
        const buffer = await this.exportService.exportTable(table, format, plantaNorm);
        res.setHeader('Content-Disposition', `attachment; filename=${table}${suffix}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(buffer);
      } else {
        const csv = await this.exportService.exportTable(table, format, plantaNorm);
        res.setHeader('Content-Disposition', `attachment; filename=${table}${suffix}.csv`);
        res.setHeader('Content-Type', 'text/csv');
        return res.send(csv);
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  /** POST /export/all?planta=catamarca|varela|all */
  @Post('all')
  async exportAllTables(
    @Query('planta') planta: string | undefined,
    @Body() body: { tables?: string[] } | undefined,
    @Res() res: Response,
  ) {
    try {
      const tables = body?.tables ?? [
        'productos',
        'insumos',
        'matriz_mano',
        'matriz_energia',
        'resultados_cdr',
        'recetas_normalizada',
      ];
      const plantaNorm = normalizarPlanta(planta);
      const suffix = plantaNorm ? `_${plantaNorm}` : '';

      const buffer = await this.exportService.exportMultipleTables(tables, plantaNorm);
      res.setHeader('Content-Disposition', `attachment; filename=exportacion_completa${suffix}.xlsx`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buffer);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}
