import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Post,
  Delete,
  Query,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { TablaConfigService } from './tabla-config.service';
import { TablaConfigBodyDto, ValorUpdateDto } from './tabla-config.dto';

@Controller('tabla-config')
export class TablaConfigController {
  constructor(private readonly service: TablaConfigService) {}

  @Get()
  listarTodos(@Query('planta') planta?: string) {
    return this.service.listarTodos(planta ?? null);
  }

  // Endpoints específicos por concepto van ANTES del genérico /:nombre
  // para evitar que Nest los matchee con la ruta dinámica
  @Get('matriz_energia')
  obtenerMatrizEnergia(@Query('planta') planta: string) {
    if (!planta) throw new BadRequestException('Falta query param ?planta=catamarca|varela');
    return this.service.obtenerMatrizEnergia(planta);
  }

  @Put('matriz_energia')
  async actualizarMatrizEnergia(
    @Body() body: ValorUpdateDto,
    @Query('planta') planta: string,
  ) {
    if (!planta) throw new BadRequestException('Falta query param ?planta=catamarca|varela');
    try {
      return await this.service.actualizarMatrizEnergia(planta, body.valor);
    } catch (error: any) {
      console.error('Update failed:', error);
      throw new HttpException(error?.message || 'Update failed', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('matriz_mano')
  obtenerMatrizMano(@Query('planta') planta: string) {
    if (!planta) throw new BadRequestException('Falta query param ?planta=catamarca|varela');
    return this.service.obtenerMatrizMano(planta);
  }

  @Put('matriz_mano')
  actualizarMatrizMano(
    @Body() body: ValorUpdateDto,
    @Query('planta') planta: string,
  ) {
    if (!planta) throw new BadRequestException('Falta query param ?planta=catamarca|varela');
    return this.service.actualizarMatrizMano(planta, body.valor);
  }

  // CRUD genérico (último para no colisionar con los específicos)
  @Get(':nombre')
  obtenerUno(@Param('nombre') nombre: string, @Query('planta') planta: string) {
    if (!planta) throw new BadRequestException('Falta query param ?planta=catamarca|varela');
    return this.service.obtenerUno(nombre, planta);
  }

  @Post()
  crear(@Body() body: TablaConfigBodyDto) {
    return this.service.crear(body);
  }

  @Put(':nombre')
  actualizar(
    @Param('nombre') nombre: string,
    @Body() body: ValorUpdateDto,
    @Query('planta') planta: string,
  ) {
    if (!planta) throw new BadRequestException('Falta query param ?planta=catamarca|varela');
    return this.service.actualizar(nombre, planta, body.valor);
  }

  @Delete(':nombre')
  eliminar(@Param('nombre') nombre: string, @Query('planta') planta: string) {
    if (!planta) throw new BadRequestException('Falta query param ?planta=catamarca|varela');
    return this.service.eliminar(nombre, planta);
  }
}
