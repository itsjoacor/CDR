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
    async eliminar(@Param('codigo') codigo: string): Promise<void> {
        try {
            await this.service.eliminar(codigo);
        } catch (error: any) {

            const message = error?.message || '';
            const detail = error?.detail || '';
            const fullText = `${message} ${detail}`.toLowerCase();

            if (
                fullText.includes('violates foreign key') ||
                fullText.includes('está siendo utilizado') ||
                fullText.includes('constraint')
            ) {
                throw new HttpException(
                    { message: message },  // 👈 importante: pasar objeto con `message`
                    HttpStatus.CONFLICT,
                );
            }

            throw new HttpException(
                { message: 'Error interno al intentar eliminar el registro.' }, // 👈 también con `message`
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
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


    @Put('default/valor-kw')
    async updateDefaultValorKw(
        @Body() body: { newValue: number }
    ): Promise<{
        message: string,
        updatedRecords: number
    }> {
        try {
            // Validación básica del body
            if (typeof body.newValue !== 'number') {
                throw new BadRequestException('El campo newValue debe ser un número');
            }

            return await this.service.updateDefaultValorKw(body.newValue);

        } catch (error) {
            // Manejo específico para errores de validación
            if (error.message.includes('mayor que cero')) {
                throw new BadRequestException(error.message);
            }

            // Manejo de otros errores
            throw new HttpException(
                {
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Error al actualizar el valor por defecto',
                    details: error.message
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('default/valor-kw')
    async getDefaultValorKw(): Promise<{ defaultValue: number }> {
        try {
            const defaultValue = await this.service.getDefaultValorKw();
            return { defaultValue };
        } catch (error) {
            throw new HttpException(
                {
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    error: 'Error al obtener el valor por defecto'
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
                {
                    cause: error
                }
            );
        }
    }

}