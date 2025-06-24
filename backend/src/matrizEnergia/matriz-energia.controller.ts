import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { MatrizEnergiaService } from './matriz-energia.service';
import { MatrizEnergiaBodyDto } from './matriz-energia-body.dto';
import { MatrizEnergia } from './matriz-energia.model';

@Controller('matriz-energia')
export class MatrizEnergiaController {
    constructor(private readonly service: MatrizEnergiaService) { }

    @Get()
    obtenerTodos(): Promise<MatrizEnergia[]> {
        return this.service.obtenerTodos();
    }

    @Get(':codigo')
    obtenerPorCodigo(@Param('codigo') codigo: string): Promise<MatrizEnergia> {
        return this.service.obtenerPorCodigo(codigo);
    }

    @Post()
    async crear(@Body() body: MatrizEnergiaBodyDto): Promise<MatrizEnergia> {
        const dtoToModel: MatrizEnergia = {
            ...body,
            valor_kw: body.valor_kw ?? 89.4,
        };
        return this.service.crear(dtoToModel);
    }

    @Put(':codigo')
    actualizar(
        @Param('codigo') codigo: string,
        @Body() body: Partial<MatrizEnergiaBodyDto>
    ): Promise<MatrizEnergia> {
        return this.service.actualizar(codigo, body);
    }

    @Delete(':codigo')
    eliminar(@Param('codigo') codigo: string): Promise<void> {
        return this.service.eliminar(codigo);
    }
}
