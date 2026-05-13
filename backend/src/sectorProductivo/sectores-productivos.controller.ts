// sectores-productivos.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Put
} from '@nestjs/common';
import { UpdatePorcentajeMantencionV2Dto } from './sectores-productivos-body.dto';


import { SectorProductivo } from '../sectorProductivo/sectores-productivos.model';
import { SectorProductivoBody } from './sectores-productivos-body.dto';
import { SectorProductivoService } from './sectores-productivos.service';
import { normalizarPlanta } from '../config/planta.helper';

@Controller('sectores-productivos')
export class SectorProductivoController {
  private readonly logger = new Logger(SectorProductivoController.name);

  constructor(private readonly sectorProductivoService: SectorProductivoService) { }

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

  /** GET /sectores-productivos?planta=catamarca|varela|all */
  @Get()
  async obtenerTodos(@Query('planta') planta?: string): Promise<SectorProductivo[]> {
    try {
      return await this.sectorProductivoService.obtenerTodos(normalizarPlanta(planta));
    } catch (error) {
      this.logger.error('Error al obtener sectores productivos', error.stack);
      throw new HttpException(
        'Error al obtener sectores productivos',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }


  /** GET /sectores-productivos/mantencion?planta=catamarca|varela|all */
  @Get('mantencion')
  async listarMantencionV2(@Query('planta') planta?: string) {
    return this.sectorProductivoService.listarSectoresMantencionV2(normalizarPlanta(planta));
  }

  // === V2: GET un sector (endpoint nuevo) ===
  // GET /sectores-productivos/:nombre/porcentaje-mantencion-v2
  @Get(':nombre/porcentaje-mantencion-v2')
  async getPorcentajeMantencionV2(@Param('nombre') nombre: string) {
    const porcentaje = await this.sectorProductivoService.getPorcentajeMantencionV2(nombre);
    return { nombre, porcentajeMantencion: porcentaje };
  }

  // === V2: PUT un sector (endpoint nuevo) ===
  // PUT /sectores-productivos/:nombre/porcentaje-mantencion-v2
  @Put(':nombre/porcentaje-mantencion-v2')
  async updatePorcentajeMantencionV2(
    @Param('nombre') nombre: string,
    @Body() body: UpdatePorcentajeMantencionV2Dto,
  ) {
    return this.sectorProductivoService.updatePorcentajeMantencionV2(nombre, body.porcentajeMantencion);
  }
}