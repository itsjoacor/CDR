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

@Controller('import')
export class ImportacionController {
  constructor(private readonly importacionService: ImportacionService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Query('table') table: string = 'insumos',
    @Query('mode') mode: string = 'update_only',
  ) {
    if (!file) throw new BadRequestException('Debe adjuntar un archivo CSV');
    return this.importacionService.importCsv(file, table, mode);
  }

  /** POST /import/recetas?mode=new|update — bulk import recetas_normalizada */
  @Post('recetas')
  @UseInterceptors(FileInterceptor('file'))
  async importRecetas(
    @UploadedFile() file: Express.Multer.File,
    @Query('mode') mode: 'new' | 'update' = 'new',
  ) {
    if (!file) throw new BadRequestException('Debe adjuntar un archivo CSV o Excel');
    try {
      return await this.importacionService.importRecetas(file, mode);
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err?.message || 'Error procesando recetas', HttpStatus.BAD_REQUEST);
    }
  }
}
