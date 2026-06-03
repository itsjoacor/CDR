import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { PlantasService, PlantaNombre } from './plantas.service';

@Controller('plantas')
export class PlantasController {
  constructor(private readonly plantasService: PlantasService) {}

  /** GET /plantas — lista las plantas con sus valor_flete */
  @Get()
  async listar() {
    try {
      return await this.plantasService.listar();
    } catch (err: any) {
      throw new HttpException(err?.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /** GET /plantas/:nombre — datos de una planta */
  @Get(':nombre')
  async obtener(@Param('nombre') nombre: string) {
    try {
      return await this.plantasService.obtener(nombre as PlantaNombre);
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err?.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * PUT /plantas/:nombre/flete — actualizar valor_flete ($ por m³) + recalcular productos
   * Body: { valor_flete: number }
   */
  @Put(':nombre/flete')
  async actualizarFlete(
    @Param('nombre') nombre: string,
    @Body() body: { valor_flete: number },
  ) {
    if (body?.valor_flete === undefined || body?.valor_flete === null) {
      throw new BadRequestException('Falta valor_flete en el body');
    }
    try {
      return await this.plantasService.actualizarFlete(
        nombre as PlantaNombre,
        Number(body.valor_flete),
      );
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err?.message, HttpStatus.BAD_REQUEST);
    }
  }

  /** POST /plantas/:nombre/recalcular — fuerza recálculo (botón admin) */
  @Put(':nombre/recalcular')
  async recalcular(@Param('nombre') nombre: string) {
    try {
      return await this.plantasService.recalcularFletesDeProductos(nombre as PlantaNombre);
    } catch (err: any) {
      throw new HttpException(err?.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * PUT /plantas/:nombre/flete-insumo — actualizar valor_flete_insumo ($ por m³)
   * Body: { valor_flete_insumo: number }
   * El recálculo de recetas dependientes lo dispara el trigger DB; acá solo
   * persistimos el nuevo valor.
   */
  @Put(':nombre/flete-insumo')
  async actualizarFleteInsumo(
    @Param('nombre') nombre: string,
    @Body() body: { valor_flete_insumo: number },
  ) {
    if (body?.valor_flete_insumo === undefined || body?.valor_flete_insumo === null) {
      throw new BadRequestException('Falta valor_flete_insumo en el body');
    }
    try {
      return await this.plantasService.actualizarFleteInsumo(
        nombre as PlantaNombre,
        Number(body.valor_flete_insumo),
      );
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new HttpException(err?.message, HttpStatus.BAD_REQUEST);
    }
  }
}
