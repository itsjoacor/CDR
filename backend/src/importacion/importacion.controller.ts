import {
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
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
    // Nota: si querés cerrar estrictamente a insumos:
    // if (table !== 'insumos') throw new BadRequestException('Solo insumos');
  }
}
