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

@Controller('implosion')
export class ImplosionController {
  private readonly logger = new Logger(ImplosionController.name);

  constructor(private readonly implosionService: ImplosionService) {}

  /** POST /implosion/import?periodo=2025-04  (multipart: field "file") */
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importar(
    @UploadedFile() file: Express.Multer.File,
    @Query('periodo') periodo: string,
  ) {
    if (!file) throw new BadRequestException('Debe adjuntar un archivo Excel (.xlsx)');
    if (!periodo) throw new BadRequestException('El parámetro "periodo" es requerido (ej: 2025-04)');
    try {
      return await this.implosionService.importarPeriodo(file, periodo);
    } catch (err: any) {
      this.logger.error('Error importando implosión', err?.message);
      throw new HttpException(err?.message || 'Error procesando archivo', HttpStatus.BAD_REQUEST);
    }
  }

  /** GET /implosion/periodos */
  @Get('periodos')
  async getPeriodos() {
    try {
      return await this.implosionService.getPeriodos();
    } catch (err: any) {
      throw new HttpException(err?.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /** DELETE /implosion/periodos/:periodo */
  @Delete('periodos/:periodo')
  async deletePeriodo(@Param('periodo') periodo: string) {
    try {
      return await this.implosionService.deletePeriodo(periodo);
    } catch (err: any) {
      throw new HttpException(err?.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /** GET /implosion/corrido */
  @Get('corrido')
  async getCorrido() {
    try {
      return await this.implosionService.getCorrido();
    } catch (err: any) {
      throw new HttpException(err?.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /** GET /implosion/detalle/:periodo */
  @Get('detalle/:periodo')
  async getDetalle(@Param('periodo') periodo: string) {
    try {
      return await this.implosionService.getDetalle(periodo);
    } catch (err: any) {
      throw new HttpException(err?.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /** GET /implosion/por-sector/:periodo */
  @Get('por-sector/:periodo')
  async getPorSector(@Param('periodo') periodo: string) {
    try {
      return await this.implosionService.getPorSector(periodo);
    } catch (err: any) {
      throw new HttpException(err?.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /** GET /implosion/export/:periodo → descarga XLSX */
  @Get('export/:periodo')
  async exportPeriodo(@Param('periodo') periodo: string, @Res() res: Response) {
    try {
      const buffer = await this.implosionService.exportPeriodo(periodo);
      const filename = `implosion_${periodo}.xlsx`;
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
