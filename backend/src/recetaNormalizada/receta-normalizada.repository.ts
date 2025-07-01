import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { supabase } from '../config/supabase.client';
import { RecetaNormalizada } from './receta-normalizada.model';
import { CreateRecetaNormalizadaDto } from './receta-nomralizada.dto';

@Injectable()
export class RecetaNormalizadaRepository {
  private async existeEnTabla(tabla: string, campo: string, valor: string): Promise<boolean> {
    const { data, error } = await supabase
      .from(tabla)
      .select(campo)
      .eq(campo, valor)
      .maybeSingle();

    if (error) {
      console.error(`Error al verificar existencia en ${tabla}:`, error);
      return false;
    }

    return !!data;
  }

  private async existeEnAlgunaTabla(codigo: string): Promise<boolean> {
    // Verifica en cascada con short-circuit
    return (await this.existeEnTabla('productos', 'codigo_producto', codigo)) ||
      (await this.existeEnTabla('insumos', 'codigo', codigo)) ||
      (await this.existeEnTabla('matriz_mano', 'codigo_mano_obra', codigo)) ||
      (await this.existeEnTabla('matriz_energia', 'codigo_energia', codigo));
  }

  async crear(dto: CreateRecetaNormalizadaDto) {
    try {
      const { codigo_producto, codigo_ingrediente, cantidad_ingrediente } = dto;

      // Normalizar códigos
      const codProducto = codigo_producto.trim().toUpperCase();
      const codIngrediente = codigo_ingrediente.trim().toUpperCase();

      // Validación básica
      if (!codProducto || !codIngrediente || cantidad_ingrediente == null) {
        throw new HttpException(
          'Datos incompletos: código de producto, código de ingrediente y cantidad son requeridos',
          HttpStatus.BAD_REQUEST
        );
      }

      if (isNaN(cantidad_ingrediente) || cantidad_ingrediente <= 0) {
        throw new HttpException(
          'La cantidad debe ser un número mayor a cero',
          HttpStatus.BAD_REQUEST
        );
      }

      // Verificar existencia en paralelo
      const [productoExiste, ingredienteExiste] = await Promise.all([
        this.existeEnTabla('productos', 'codigo_producto', codProducto),
        this.existeEnAlgunaTabla(codIngrediente)
      ]);

      if (!productoExiste) {
        throw new HttpException(
          `El producto "${codProducto}" no existe. Debe crearlo primero.`,
          HttpStatus.BAD_REQUEST
        );
      }

      if (!ingredienteExiste) {
        // Verificación detallada para mensaje de error más informativo
        const tablas = ['productos', 'insumos', 'matriz_mano', 'matriz_energia'];
        const resultados = await Promise.all(
          tablas.map(tabla => this.existeEnTabla(tabla, this.getCampoId(tabla), codIngrediente))
        );

        const tablasDondeNoExiste = tablas.filter((_, i) => !resultados[i]);
        throw new HttpException(
          `El ingrediente "${codIngrediente}" no existe en las siguientes tablas: ${tablasDondeNoExiste.join(', ')}`,
          HttpStatus.BAD_REQUEST
        );
      }

      // Prevenir recursión (producto que se contiene a sí mismo)
      if (codProducto === codIngrediente) {
        throw new HttpException(
          'Un producto no puede ser ingrediente de sí mismo',
          HttpStatus.BAD_REQUEST
        );
      }

      // Insertar en la base de datos
      const { error } = await supabase.from('recetas_normalizada').insert({
        codigo_producto: codProducto,
        codigo_ingrediente: codIngrediente,
        cantidad_ingrediente: cantidad_ingrediente
      });

      if (error) {
        // Manejo específico para error de duplicado
        if (error.code === '23505') {
          throw new HttpException(
            `La combinación "${codProducto}" (producto) y "${codIngrediente}" (ingrediente) ya existe en la receta`,
            HttpStatus.CONFLICT
          );
        }

        // Manejo genérico de otros errores de Supabase
        console.error('Error de Supabase:', error);
        throw new HttpException(
          `Ocurrió un error al guardar la receta: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return {
        success: true,
        message: `Receta creada exitosamente: ${codProducto} con ingrediente ${codIngrediente}`,
        data: {
          codigo_producto: codProducto,
          codigo_ingrediente: codIngrediente,
          cantidad_ingrediente: cantidad_ingrediente
        }
      };

    } catch (error) {
      // Si el error ya es una HttpException, simplemente lo relanzamos
      if (error instanceof HttpException) {
        throw error;
      }

      // Para errores inesperados
      console.error('Error inesperado en crear receta:', error);
      throw new HttpException(
        'Ocurrió un error inesperado al procesar la receta',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private getCampoId(tabla: string): string {
    const map: Record<string, string> = {
      productos: 'codigo_producto',
      insumos: 'codigo',
      matriz_mano: 'codigo_mano_obra',
      matriz_energia: 'codigo_matriz_energia'
    };
    return map[tabla] || 'codigo';
  }




  async obtenerTodas(): Promise<RecetaNormalizada[]> {
    const { data, error } = await supabase.from('recetas_normalizada').select('*');
    if (error) {
      throw new HttpException('Error al obtener recetas: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return data as RecetaNormalizada[];
  }

  async eliminar(codigo_producto: string, codigo_ingrediente: string) {
    const { error } = await supabase
      .from('recetas_normalizada')
      .delete()
      .match({ codigo_producto, codigo_ingrediente });

    if (error) {
      throw new HttpException('Error al eliminar receta: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async actualizar(
    codigo_producto: string,
    codigo_ingrediente: string,
    cantidad_ingrediente: number
  ) {
    const { error } = await supabase
      .from('recetas_normalizada')
      .update({ cantidad_ingrediente })
      .match({ codigo_producto, codigo_ingrediente });

    if (error) {
      throw new HttpException('Error al actualizar receta: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }




}
