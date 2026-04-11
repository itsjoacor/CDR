import { Injectable, Inject, Scope } from '@nestjs/common';
import { Request } from 'express';
import { ProductoRepository } from '../productos/producto.repository';
import { InsumoRepository } from '../insumo/insumo.repository';
import { MatrizManoRepository } from '../matrizMano/matiz-mano.repository';
import { MatrizEnergiaRepository } from '../matrizEnergia/matiz-energia.repository';

@Injectable({ scope: Scope.REQUEST })
export class AutocompleteService {
  constructor(
    private readonly productoRepo: ProductoRepository,
    private readonly insumoRepo: InsumoRepository,
    private readonly matrizManoRepo: MatrizManoRepository,
    private readonly matrizEnergiaRepo: MatrizEnergiaRepository,
    @Inject('REQUEST') private readonly request: Request
  ) { }

  async autocompleteProducto(codigo: string) {
    const producto = await this.productoRepo.obtenerPorCodigo(codigo);
    return {
      descripcion: producto?.descripcion_producto || '',
      sector: producto?.sector_productivo || ''
    };
  }

  async autocompleteIngrediente(codigo: string) {
    const [producto, insumo, mano, energia] = await Promise.all([
      this.productoRepo.obtenerPorCodigo(codigo),
      this.insumoRepo.buscarPorCodigo(codigo),
      this.matrizManoRepo.obtenerPorCodigo(codigo),
      this.matrizEnergiaRepo.obtenerPorCodigo(codigo),
    ]);

    if (producto) return { descripcion: producto.descripcion_producto || 'Ingrediente no encontrado' };
    if (insumo)   return { descripcion: insumo.detalle              || 'Ingrediente no encontrado' };
    if (mano)     return { descripcion: mano.descripcion            || 'Ingrediente no encontrado' };
    if (energia)  return { descripcion: energia.descripcion         || 'Ingrediente no encontrado' };

    return { descripcion: '' };
  }
}