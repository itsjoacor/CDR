import { Controller, Post, Body, Get, Delete, Param, Put } from '@nestjs/common';
import { RecetaNormalizadaService } from '../recetaNormalizada/receta-normalizada.service';
import { CreateRecetaNormalizadaDto } from '../recetaNormalizada/receta-nomralizada.dto';

@Controller('recetas-normalizada')
export class RecetaNormalizadaController {
  constructor(private readonly service: RecetaNormalizadaService) {}

  @Post()
  crear(@Body() dto: CreateRecetaNormalizadaDto) {
    return this.service.crear(dto);
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

  @Put()
  actualizar(@Body() dto: CreateRecetaNormalizadaDto) {
    return this.service.actualizar(dto);
  }
}
