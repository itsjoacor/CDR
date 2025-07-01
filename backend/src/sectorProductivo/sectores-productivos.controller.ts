// sectores-productivos.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';

import { SectorProductivo } from '../sectorProductivo/sectores-productivos.model';
import { SectorProductivoBody } from './sectores-productivos-body.dto';
import { SectorProductivoService } from './sectores-productivos.service';

@Controller('sectores-productivos')
export class SectorProductivoController {
  private readonly logger = new Logger(SectorProductivoController.name);

  constructor(private readonly sectorProductivoService: SectorProductivoService) {}

  @Post()
  async crear(@Body() body: SectorProductivoBody): Promise<SectorProductivo> {
    try {
      const sector = body.aModelo();
      return await this.sectorProductivoService.crear(sector);
    } catch (error) {
      this.logger.error('Error al crear sector productivo', error.stack);
      throw new HttpException(
        error.message,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  async obtenerTodos(): Promise<SectorProductivo[]> {
    try {
      return await this.sectorProductivoService.obtenerTodos();
    } catch (error) {
      this.logger.error('Error al obtener sectores productivos', error.stack);
      throw new HttpException(
        'Error al obtener sectores productivos',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}