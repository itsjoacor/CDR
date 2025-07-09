import { Controller, Get, Put, Body, Param, Post, Delete, HttpException, HttpStatus } from '@nestjs/common';
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



  @Put('matriz_energia')
  async actualizarMatrizEnergia(@Body() body: ValorUpdateDto) {
    try {
      console.log('Updating matriz_energia with value:', body.valor);
      const result = await this.service.actualizarMatrizEnergia(body.valor);
      console.log('Update successful:', result);
      return result;
    } catch (error) {
      console.error('Update failed:', error);
      throw new HttpException(
        error.message || 'Update failed',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('matriz_energia')  // Changed from 'energia' to match PUT
  obtenerMatrizEnergia() {
    return this.service.obtenerMatrizEnergia();
  }

  // Labor specific endpoints
  @Put('matriz_mano')
  actualizarMatrizMano(@Body() body: ValorUpdateDto) {
    return this.service.actualizarMatrizMano(body.valor);
  }

  @Get('matriz_mano')  // Changed from 'mano-obra' to be consistent
  obtenerMatrizMano() {
    return this.service.obtenerMatrizMano();
  }
}
