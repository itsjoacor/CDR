import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
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
  obtenerPorCodigo(
    @Param('codigo') codigo: string,
  ): Promise<MatrizMano | null> {
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
    @Body() body: Partial<MatrizManoBodyDto>,
  ): Promise<MatrizMano> {

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

      // Captura ambos casos: trigger personalizado o FK nativa
      if (
        fullText.includes('foreign_key_violation') ||
        fullText.includes('está siendo utilizado') ||
        fullText.includes('violates foreign key') ||
        fullText.includes('constraint')
      ) {
        throw new HttpException(
          {
            message: 'No se puede eliminar, se está utilizando en otra tabla.',
          },
          HttpStatus.CONFLICT,
        );
      }

      throw new HttpException(
        { message: 'Error interno al intentar eliminar el registro.' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  @Get('exists/:codigo')
  async validarCodigo(
    @Param('codigo') codigo: string,
  ): Promise<{ exists: boolean }> {
    try {
      const matriz = await this.service.obtenerPorCodigo(codigo);
      return { exists: matriz !== null };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Error al validar código',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  obtenerTodoLosCodigos(): Promise<String[]> {
    return this.service.obtenerTodosLosCodigos();
  }
}
