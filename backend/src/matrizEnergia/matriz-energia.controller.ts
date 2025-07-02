import { Controller, Get, Post, Put, Delete, Param, Body, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
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
        try {
            const dtoToModel: MatrizEnergia = {
                ...body,
                valor_kw: body.valor_kw ?? 89.4,
            };
            return await this.service.crear(dtoToModel);
        } catch (error: any) {
            throw new BadRequestException(error.message);
        }
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


    @Get('exists/:codigo')
    async validarCodigo(@Param('codigo') codigo: string): Promise<{ exists: boolean }> {
        try {
            const matriz = await this.service.obtenerPorCodigo(codigo);
            return { exists: matriz !== null };
        } catch (error) {
            throw new HttpException(
                { status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'Error al validar código' },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

}