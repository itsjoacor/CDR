import { Controller, Get, Put, Body, Param, Post, Delete } from '@nestjs/common';
import { TablaConfigService } from './tabla-config.service';
import { TablaConfigBodyDto, ValorUpdateDto } from './tabla-config.dto';

@Controller('tabla-config')
export class TablaConfigController {
  constructor(private readonly service: TablaConfigService) { }

  @Get()
  listarTodos() {
    return this.service.listarTodos();
  }

  @Get(':nombre')
  obtenerUno(@Param('nombre') nombre: string) {
    return this.service.obtenerUno(nombre);
  }

  @Post()
  crear(@Body() body: TablaConfigBodyDto) {
    return this.service.crear(body);
  }

  @Put(':nombre')
  actualizar(@Param('nombre') nombre: string, @Body() body: ValorUpdateDto) {
    return this.service.actualizar(nombre, body.valor);
  }

  @Delete(':nombre')
  eliminar(@Param('nombre') nombre: string) {
    return this.service.eliminar(nombre);
  }

  // Special endpoints
  @Put('matriz_energia')
  actualizarMatrizEnergia(@Body() body: ValorUpdateDto) {
    return this.service.actualizar('matriz_energia', body.valor);
  }

  @Put('matriz_mano')
  actualizarMatrizMano(@Body() body: ValorUpdateDto) {
    return this.service.actualizar('matriz_mano', body.valor);
  }

  @Get('matriz_energia/valor')
  getValorMatrizEnergia() {
    return this.service.obtenerUno('matriz_energia');
  }

  @Get('matriz_mano/valor')
  getValorMatrizMano() {
    return this.service.obtenerUno('matriz_mano');
  }
}