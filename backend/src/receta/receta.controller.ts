import {
  Controller,
  Post,
  Body,
  Logger,
  HttpException,
  HttpStatus,
  Get,
  Query,
  Param,
  Put,
  Delete,
  Inject,
  Scope
} from '@nestjs/common';
import { RecetaService } from './receta.service';
import { plainToInstance } from 'class-transformer';
import { RecetaBody } from './receta-body.dto';
import { Receta } from './receta.model';

@Controller('recetas')
export class RecetaController {
  private readonly logger = new Logger(RecetaController.name);

  constructor(private readonly recetaService: RecetaService) { }

  @Post('registrar')
  async registro(@Body() body: RecetaBody): Promise<Receta> {
    try {
      const recetaBody = plainToInstance(RecetaBody, body);
      const receta: Receta = recetaBody.aModelo();
      const recetaRegistrada = await this.recetaService.guardarReceta(receta);
      return recetaRegistrada;
    } catch (error) {
      this.logger.error('Error en registro', error.stack);
      throw new HttpException(
        `Error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('buscar')
  async buscarRecetas(
    @Query('codigo_producto') codigo_producto?: string,
    @Query('codigo_ingrediente') codigo_ingrediente?: string,
    @Query('sector_productivo') sector_productivo?: string,
  ): Promise<Receta[]> {
    return this.recetaService.buscarPorFiltros({
      codigo_producto,
      codigo_ingrediente,
      sector_productivo
    });
  }

  @Get(':codigo_producto/:codigo_ingrediente')
  async obtenerReceta(
    @Param('codigo_producto') codigo_producto: string,
    @Param('codigo_ingrediente') codigo_ingrediente: string,
  ) {
    return this.recetaService.obtenerRecetaPorClaves(codigo_producto, codigo_ingrediente);
  }

  @Get()
  async listarRecetas(): Promise<Receta[]> {
    return this.recetaService.obtenerTodas();
  }

  @Put(':id')
  async actualizarReceta(
    @Param('id') id: string,
    @Body() receta: Partial<Receta>,
  ): Promise<Receta> {
    return this.recetaService.actualizarReceta(id, receta);
  }

  @Delete(':id')
  async eliminarReceta(@Param('id') id: string): Promise<{ message: string }> {
    try {
      await this.recetaService.eliminarReceta(id);
      return { message: 'Receta eliminada exitosamente' };
    } catch (error) {
      this.logger.error('Error al eliminar receta', error.stack);
      throw new HttpException(
        `Error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}