import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { MatrizManoService } from './matriz-mano.service';
import { MatrizManoBodyDto } from './matriz-mano-body.dto';
import { MatrizMano } from './matriz-mano.model';

@Controller('matriz-mano')
export class MatrizManoController {
    constructor(private readonly service: MatrizManoService) { }

    @Get()
    obtenerTodos(): Promise<MatrizMano[]> {
        return this.service.obtenerTodos();
    }

    @Get(':codigo')
    obtenerPorCodigo(@Param('codigo') codigo: string): Promise<MatrizMano | null> {
        return this.service.obtenerPorCodigo(codigo);
    }

    @Post()
    async crear(@Body() body: MatrizManoBodyDto): Promise<MatrizMano> {
        const dtoToModel: MatrizMano = {
            ...body,
            valor_hora_hombre: body.valor_hora_hombre ?? 3000,
        };
        return this.service.crear(dtoToModel);
    }


    @Put(':codigo')
    actualizar(
        @Param('codigo') codigo: string,
        @Body() body: Partial<MatrizManoBodyDto>
    ): Promise<MatrizMano> {
        return this.service.actualizar(codigo, body);
    }

    @Delete(':codigo')
    eliminar(@Param('codigo') codigo: string): Promise<void> {
        return this.service.eliminar(codigo);
    }
}
