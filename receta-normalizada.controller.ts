import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  Put,
  HttpException,
  HttpStatus,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { RecetaNormalizadaService } from '../recetaNormalizada/receta-normalizada.service';
import { CreateRecetaNormalizadaDto } from '../recetaNormalizada/receta-nomralizada.dto';

@Controller('recetas-normalizada')
export class RecetaNormalizadaController {
  constructor(private readonly service: RecetaNormalizadaService) { }

  @Post()
  async crear(@Body() dto: CreateRecetaNormalizadaDto) {
    const result = await this.service.crear(dto);

    if (!result.success) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: result.message,
          details: result.error,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      status: 'success',
      data: result.data,
      message: result.message,
    };
  }

  @Get()
  obtenerTodas() {
    return this.service.obtenerTodas();
  }

  /** NUEVO: GET por producto */
  @Get('por-producto/:codigo_producto')
  async obtenerPorProducto(@Param('codigo_producto') codigo_producto: string) {
    if (!codigo_producto) {
      throw new BadRequestException('codigo_producto es requerido');
    }
    return this.service.obtenerPorProducto(codigo_producto);
  }

  /**
   * NUEVO: flags/zero-cost
   * - Sin query -> devuelve todos los { codigo_producto } con algún costo_total 0/NULL
   * - Con ?codigo=ABC -> devuelve [] o [{ codigo_producto: 'ABC' }]
   */
  @Get('flags/zero-cost')
  async productosConCostoTotalCero(@Query('codigo') codigo?: string) {
    return this.service.productosConCostoTotalCero(codigo);
  }

  /**
   * Versión bulk de tiene-cdr-cero: devuelve todos los { codigo_producto }
   * que tienen CDR en cero. Evita N llamadas individuales del cliente.
   */
  @Get('flags/cdr-cero')
  async productosConCdrCero() {
    return this.service.productosConCdrCero();
  }

  @Delete(':codigo_producto/:codigo_ingrediente')
  eliminar(
    @Param('codigo_producto') codigo_producto: string,
    @Param('codigo_ingrediente') codigo_ingrediente: string,
  ) {
    return this.service.eliminar(codigo_producto, codigo_ingrediente);
  }

  /** NUEVO: DELETE por producto (eliminar receta completa) */
  @Delete('por-producto/:codigo_producto')
  async eliminarPorProducto(@Param('codigo_producto') codigo_producto: string) {
    if (!codigo_producto) {
      throw new BadRequestException('codigo_producto es requerido');
    }
    return this.service.eliminarRecetaCompleta(codigo_producto);
  }

  @Put(':codigo_producto/:codigo_ingrediente')
  async actualizarPorRuta(
    @Param('codigo_producto') codigo_producto: string,
    @Param('codigo_ingrediente') codigo_ingrediente: string,
    @Body('cantidad_ingrediente') cantidad_ingrediente: number,
  ) {
    if (
      cantidad_ingrediente === undefined ||
      cantidad_ingrediente === null ||
      isNaN(Number(cantidad_ingrediente))
    ) {
      throw new BadRequestException(
        'cantidad_ingrediente debe enviarse en el body como número',
      );
    }

    await this.service.actualizarPorIds(
      codigo_producto,
      codigo_ingrediente,
      Number(cantidad_ingrediente),
    );

    return {
      codigo_producto,
      codigo_ingrediente,
      cantidad_ingrediente: Number(cantidad_ingrediente),
    };
  }

  // receta-normalizada.controller.ts - Agregar este endpoint
  @Get(':codigo_producto/tiene-cdr-cero')
  async tieneValorCdrCero(@Param('codigo_producto') codigo_producto: string) {
    const result = await this.service.tieneValorCdrCero(codigo_producto);

    if (!result.success) {
      throw new HttpException(
        { status: HttpStatus.BAD_REQUEST, error: result.message },
        HttpStatus.BAD_REQUEST
      );
    }

    return {
      status: 'success',
      tieneCdrCero: result.tieneCdrCero,
      message: result.message
    };
  }
}
