import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { InsumoService } from '../service/insumo.service';
import { CreateInsumoDto, UpdateInsumoDto } from '../dto/insumo-body.dto';
import { Insumo } from '../model/insumo.model';

@Controller('insumos')
export class InsumoController {
  constructor(private readonly insumoService: InsumoService) {}

  @Post()
  create(@Body() createInsumoDto: CreateInsumoDto): Promise<Insumo> {
    return this.insumoService.create(createInsumoDto);
  }

  @Get()
  findAll(): Promise<Insumo[]> {
    return this.insumoService.findAll();
  }

  @Get(':codigo')
  findOne(@Param('codigo') codigo: string): Promise<Insumo> {
    return this.insumoService.findOne(codigo);
  }

  @Put(':codigo')
  update(
    @Param('codigo') codigo: string,
    @Body() updateInsumoDto: UpdateInsumoDto,
  ): Promise<Insumo> {
    return this.insumoService.update(codigo, updateInsumoDto);
  }

  @Delete(':codigo')
  remove(@Param('codigo') codigo: string): Promise<void> {
    return this.insumoService.remove(codigo);
  }
}