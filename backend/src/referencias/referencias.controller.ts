import { Body, Controller, Post, HttpException, HttpStatus } from '@nestjs/common';
import { ReferenciasService } from './referencias.service';

@Controller('referencias')
export class ReferenciasController {
  constructor(private readonly service: ReferenciasService) {}

  /**
   * POST /referencias/nombres
   * Body: { codigos: string[] }
   * Devuelve un objeto { codigo: descripcion }
   */
  @Post('nombres')
  async obtenerNombres(@Body() body: { codigos: string[] }) {
    const { codigos } = body;
    if (!codigos || !Array.isArray(codigos) || codigos.length === 0) {
      throw new HttpException('Debe enviar un array de códigos', HttpStatus.BAD_REQUEST);
    }

    return this.service.obtenerNombres(codigos);
  }
}
