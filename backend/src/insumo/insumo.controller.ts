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
  BadRequestException,
} from '@nestjs/common';
import { InsumoService } from './insumo.service';
import { plainToInstance } from 'class-transformer';
import { InsumoBody } from './insumo-body.dto';
import { Insumo } from './insumo.model';
import { normalizarPlanta } from '../config/planta.helper';

@Controller('insumos')
export class InsumoController {
  private readonly logger = new Logger(InsumoController.name);

  constructor(private readonly insumoService: InsumoService) { }

  /** Helper: parsea y valida que la planta sea catamarca o varela (requerido) */
  private requirePlanta(raw?: string): 'catamarca' | 'varela' {
    const p = (raw ?? '').toLowerCase();
    if (p !== 'catamarca' && p !== 'varela') {
      throw new BadRequestException(
        'Falta query param "planta" (debe ser catamarca o varela). ' +
        'Los insumos viven por planta — hay que especificar de cuál.'
      );
    }
    return p;
  }

  /** GET /insumos?planta=catamarca|varela|all */
  @Get()
  async listarInsumos(@Query('planta') planta?: string): Promise<Insumo[]> {
    return this.insumoService.obtenerTodos(normalizarPlanta(planta));
  }

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

  /** GET /insumos/buscar?codigo=&grupo=&detalle=&planta= */
  @Get('buscar')
  async buscarInsumos(
    @Query('codigo') codigo?: string,
    @Query('grupo') grupo?: string,
    @Query('detalle') detalle?: string,
    @Query('planta') planta?: string,
  ): Promise<Insumo[]> {
    return this.insumoService.buscarPorFiltros({
      codigo,
      grupo,
      detalle,
      planta: normalizarPlanta(planta),
    });
  }

  /** GET /insumos/:codigo?planta=catamarca|varela */
  @Get(':codigo')
  async obtenerInsumo(
    @Param('codigo') codigo: string,
    @Query('planta') planta?: string,
  ) {
    const p = this.requirePlanta(planta);
    return this.insumoService.obtenerInsumoPorCodigo(codigo, p);
  }

  /** PUT /insumos/:codigo?planta=catamarca|varela */
  @Put(':codigo')
  async actualizarInsumo(
    @Param('codigo') codigo: string,
    @Body() insumo: Partial<Insumo>,
    @Query('planta') planta?: string,
  ): Promise<Insumo> {
    const p = this.requirePlanta(planta);
    return this.insumoService.actualizarInsumo(codigo, p, insumo);
  }

  /** DELETE /insumos/:codigo?planta=catamarca|varela */
  @Delete(':codigo')
  async eliminarInsumo(
    @Param('codigo') codigo: string,
    @Query('planta') planta?: string,
  ): Promise<{ message: string }> {
    try {
      const p = this.requirePlanta(planta);
      await this.insumoService.eliminarInsumo(codigo, p);
      return { message: 'Insumo eliminado exitosamente' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Error al eliminar insumo', error.stack);
      throw new HttpException(
        `Error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
