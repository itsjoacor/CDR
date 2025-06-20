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
  Delete
} from '@nestjs/common';
import { InsumoService } from '../service/insumo.service';
import { plainToInstance } from 'class-transformer';
import { InsumoBody } from '../dto/insumo-body.dto';
import { Insumo } from '../model/insumo.model';

@Controller('insumos')
export class InsumoController {
  private readonly logger = new Logger(InsumoController.name);

  constructor(private readonly insumoService: InsumoService) { }

  @Post('registrar')
  async registro(@Body() body: InsumoBody): Promise<Insumo> {
    try {
      const insumoBody = plainToInstance(InsumoBody, body);
      const insumo: Insumo = insumoBody.aModelo();
      const insumoRegistrado = await this.insumoService.guardarInsumo(insumo);
      return insumoRegistrado;
    } catch (error) {
      this.logger.error('Error en registro', error.stack);
      throw new HttpException(
        `Error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('buscar')
  async buscarInsumos(
    @Query('codigo') codigo?: string,
    @Query('grupo') grupo?: string,
    @Query('detalle') detalle?: string,
  ): Promise<Insumo[]> {
    return this.insumoService.buscarPorFiltros({
      codigo,
      grupo,
      detalle
    });
  }

  @Get(':codigo')
  async obtenerInsumo(@Param('codigo') codigo: string) {
    return this.insumoService.obtenerInsumoPorCodigo(codigo);
  }

  @Get()
  async listarInsumos(): Promise<Insumo[]> {
    return this.insumoService.obtenerTodos();
  }

  @Put(':codigo')
  async actualizarInsumo(
    @Param('codigo') codigo: string,
    @Body() insumo: Partial<Insumo>,
  ): Promise<Insumo> {
    return this.insumoService.actualizarInsumo(codigo, insumo);
  }

  @Delete(':codigo')
  async eliminarInsumo(@Param('codigo') codigo: string): Promise<{ message: string }> {
    try {
      await this.insumoService.eliminarInsumo(codigo);
      return { message: 'Insumo eliminado exitosamente' };
    } catch (error) {
      this.logger.error('Error al eliminar insumo', error.stack);
      throw new HttpException(
        `Error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}