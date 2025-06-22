import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ResultadosCdrService } from '../resultadosCDR/resultado-cdr.service';
import { ResultadosCdrBodyDto } from '../resultadosCDR/resultado-cdr-body.dto';
import { ResultadosCdr } from '../resultadosCDR/resultado-cdr.interface';

@Controller('resultados-cdr')
export class ResultadosCdrController {
  constructor(private readonly service: ResultadosCdrService) {}

  @Get()
  findAll(): Promise<ResultadosCdr[]> {
    return this.service.findAll();
  }

  @Get(':codigo_producto')
  findOne(@Param('codigo_producto') codigo: string): Promise<ResultadosCdr | null> {
    return this.service.findOne(codigo);
  }

  @Post()
  create(@Body() body: ResultadosCdrBodyDto): Promise<void> {
    return this.service.create(body);
  }

  @Put()
  update(@Body() body: ResultadosCdrBodyDto): Promise<void> {
    return this.service.update(body);
  }

  @Delete(':codigo_producto')
  delete(@Param('codigo_producto') codigo: string): Promise<void> {
    return this.service.delete(codigo);
  }

  @Get(':codigo_producto/base')
async getBaseCdr(@Param('codigo_producto') codigo: string): Promise<{ base_cdr: number }> {
  const base = await this.service.getBaseCdr(codigo);
  if (base === null) {
    throw new NotFoundException(`No se encontró base_cdr para el producto ${codigo}`);
  }
  return { base_cdr: base };
}

}
