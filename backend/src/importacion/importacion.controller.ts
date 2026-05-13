import {
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportacionService } from './importacion.service';
import { validarPlantaEscritura } from '../config/planta.helper';

@Controller('import')
export class ImportacionController {
  constructor(private readonly importacionService: ImportacionService) {}

  /** POST /import?table=insumos&planta=catamarca|varela */
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Query('table') table: string = 'insumos',
    @Query('mode') mode: string = 'update_only',
    @Query('planta') planta?: string,
  ) {
    if (!file) throw new BadRequestException('Debe adjuntar un archivo CSV');
    const plantaNorm = planta ? validarPlantaEscritura(planta) : 'catamarca';
    return this.importacionService.importCsv(file, table, mode, plantaNorm);
  }

  /** POST /import/recetas?mode=new|update|patch&planta=catamarca|varela */
  @Post('recetas')
  @UseInterceptors(FileInterceptor('file'))
  async importRecetas(
    @UploadedFile() file: Express.Multer.File,
    @Query('mode') mode: 'new' | 'update' | 'patch' = 'new',
    @Query('planta') planta?: string,
  ) {
    if (!file) throw new BadRequestException('Debe adjuntar un archivo CSV o Excel');
    let plantaNorm: 'catamarca' | 'varela';
    try {
      plantaNorm = validarPlantaEscritura(planta);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
    try {
      return await this.importacionService.importRecetas(file, mode, plantaNorm);
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err?.message || 'Error procesando recetas', HttpStatus.BAD_REQUEST);
    }
  }
}
