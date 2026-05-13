import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ImplosionService } from './implosion.service';
import { normalizarPlanta, validarPlantaEscritura } from '../config/planta.helper';

@Controller('implosion')
export class ImplosionController {
  private readonly logger = new Logger(ImplosionController.name);

  constructor(private readonly implosionService: ImplosionService) {}

  /**
   * POST /implosion/import?periodo=2025-04&planta=catamarca|varela
   * (multipart: field "file")
   */
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importar(
    @UploadedFile() file: Express.Multer.File,
    @Query('periodo') periodo: string,
    @Query('planta') planta?: string,
  ) {
    if (!file) throw new BadRequestException('Debe adjuntar un archivo Excel (.xlsx)');
    if (!periodo) throw new BadRequestException('El parámetro "periodo" es requerido (ej: 2025-04)');
    let plantaNorm: 'catamarca' | 'varela';
    try {
      plantaNorm = validarPlantaEscritura(planta);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
    try {
      return await this.implosionService.importarPeriodo(file, periodo, plantaNorm);
    } catch (err: any) {
      this.logger.error('Error importando implosión', err?.message);
      throw new HttpException(err?.message || 'Error procesando archivo', HttpStatus.BAD_REQUEST);
    }
  }

  /** GET /implosion/periodos?planta=catamarca|varela|all */
  @Get('periodos')
  async getPeriodos(@Query('planta') planta?: string) {
    try {
      return await this.implosionService.getPeriodos(normalizarPlanta(planta));
    } catch (err: any) {
      throw new HttpException(err?.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /** DELETE /implosion/periodos/:periodo?planta=catamarca|varela */
  @Delete('periodos/:periodo')
  async deletePeriodo(
    @Param('periodo') periodo: string,
    @Query('planta') planta?: string,
  ) {
    let plantaNorm: 'catamarca' | 'varela';
    try {
      plantaNorm = validarPlantaEscritura(planta);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
    try {
      return await this.implosionService.deletePeriodo(periodo, plantaNorm);
    } catch (err: any) {
      throw new HttpException(err?.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /** GET /implosion/corrido?planta=catamarca|varela|all */
  @Get('corrido')
  async getCorrido(@Query('planta') planta?: string) {
    try {
      return await this.implosionService.getCorrido(normalizarPlanta(planta));
    } catch (err: any) {
      throw new HttpException(err?.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /** GET /implosion/detalle/:periodo?planta=catamarca|varela */
  @Get('detalle/:periodo')
  async getDetalle(
    @Param('periodo') periodo: string,
    @Query('planta') planta?: string,
  ) {
    let plantaNorm: 'catamarca' | 'varela';
    try {
      plantaNorm = validarPlantaEscritura(planta);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
    try {
      return await this.implosionService.getDetalle(periodo, plantaNorm);
    } catch (err: any) {
      throw new HttpException(err?.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /** GET /implosion/por-sector/:periodo?planta=catamarca|varela */
  @Get('por-sector/:periodo')
  async getPorSector(
    @Param('periodo') periodo: string,
    @Query('planta') planta?: string,
  ) {
    let plantaNorm: 'catamarca' | 'varela';
    try {
      plantaNorm = validarPlantaEscritura(planta);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
    try {
      return await this.implosionService.getPorSector(periodo, plantaNorm);
    } catch (err: any) {
      throw new HttpException(err?.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /** GET /implosion/export/:periodo?planta=catamarca|varela → descarga XLSX */
  @Get('export/:periodo')
  async exportPeriodo(
    @Param('periodo') periodo: string,
    @Query('planta') planta: string,
    @Res() res: Response,
  ) {
    let plantaNorm: 'catamarca' | 'varela';
    try {
      plantaNorm = validarPlantaEscritura(planta);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
    try {
      const buffer = await this.implosionService.exportPeriodo(periodo, plantaNorm);
      const filename = `implosion_${plantaNorm}_${periodo}.xlsx`;
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      return res.send(buffer);
    } catch (err: any) {
      this.logger.error('Error exportando implosión', err?.message);
      return res.status(500).json({ error: err?.message });
    }
  }
}
