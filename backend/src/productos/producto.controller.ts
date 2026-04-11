// producto.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { ProductoService } from '../productos/producto.service';
import { ProductoBody } from '../productos/producto-body.dto';
import { Producto } from '../productos/producto.model';

@Controller('productos')
export class ProductoController {
  private readonly logger = new Logger(ProductoController.name);

  constructor(private readonly productoService: ProductoService) { }

  @Post()
  async crear(@Body() body: {
    codigo_producto: string,
    descripcion_producto: string,
    sector_productivo: string
  }): Promise<Producto> {
    try {
      // Directly create Producto from the raw body
      const producto = new Producto(
        body.codigo_producto,
        body.descripcion_producto,
        body.sector_productivo
      );

      return await this.productoService.crear(producto);
    } catch (error) {
      this.logger.error('Error al crear producto', error.stack);
      throw new HttpException(
        error.message,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  async obtenerTodos(): Promise<Producto[]> {
    try {
      return await this.productoService.obtenerTodos();
    } catch (error) {
      this.logger.error('Error al obtener productos', error.stack);
      throw new HttpException(
        'Error al obtener productos',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('con-estado')
  async obtenerConEstado() {
    try {
      return await this.productoService.obtenerTodosConEstado();
    } catch (error) {
      this.logger.error('Error al obtener productos con estado', error.stack);
      throw new HttpException('Error al obtener productos con estado', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':codigo')
  async obtenerPorCodigo(@Param('codigo') codigo: string): Promise<Producto | null> {
    try {
      const producto = await this.productoService.obtenerPorCodigo(codigo);
      if (!producto) {
        throw new HttpException('Producto no encontrado', HttpStatus.NOT_FOUND);
      }
      return producto;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Error al obtener producto', error.stack);
      throw new HttpException(
        'Error al obtener producto',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':codigo')
  async actualizar(
    @Param('codigo') codigo: string,
    @Body() body: Partial<ProductoBody>
  ): Promise<Producto> {
    try {
      return await this.productoService.actualizar(codigo, {
        descripcion_producto: body.descripcion_producto,
        sector_productivo: body.sector_productivo
      });
    } catch (error) {
      this.logger.error('Error al actualizar producto', error.stack);
      throw new HttpException(
        error.message,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':codigo')
  async eliminar(@Param('codigo') codigo: string): Promise<{ message: string }> {
    try {
      await this.productoService.eliminar(codigo);
      return { message: 'Producto eliminado exitosamente' };
    } catch (error) {
      this.logger.error('Error al eliminar producto', error.stack);
      throw new HttpException(
        error.message,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('exists/:codigo')
  async validarCodigo(@Param('codigo') codigo: string): Promise<{ exists: boolean }> {
    try {
      const producto = await this.productoService.obtenerPorCodigo(codigo);
      return { exists: producto !== null };
    } catch (error) {
      throw new HttpException(
        { status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'Error al validar código' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }


}