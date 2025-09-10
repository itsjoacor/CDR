import { Controller, Post, Body, Get, Delete, Param, Put, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
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
          details: result.error
        },
        HttpStatus.BAD_REQUEST
      );
    }

    return {
      status: 'success',
      data: result.data,
      message: result.message
    };
  }

  @Get()
  obtenerTodas() {
    return this.service.obtenerTodas();
  }

  @Delete(':codigo_producto/:codigo_ingrediente')
  eliminar(
    @Param('codigo_producto') codigo_producto: string,
    @Param('codigo_ingrediente') codigo_ingrediente: string
  ) {
    return this.service.eliminar(codigo_producto, codigo_ingrediente);
  }

  @Delete(':codigo_producto')
  async eliminarRecetaCompleta(
    @Param('codigo_producto') codigo_producto: string
  ) {
    return this.service.eliminarRecetaCompleta(codigo_producto);
  }


  @Put()
  actualizar(@Body() dto: CreateRecetaNormalizadaDto) {
    return this.service.actualizar(dto);
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

    // Devolvemos exactamente lo que el front puede mergear sin romper nada
    return {
      codigo_producto,
      codigo_ingrediente,
      cantidad_ingrediente: Number(cantidad_ingrediente),
    };
  }

}
