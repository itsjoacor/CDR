// src/autocomplete/autocomplete.service.ts
import { Injectable } from '@nestjs/common';
import { RecetaRepository } from '../receta/repository/receta.repository';
import { InsumoRepository } from '../insumo/insumo.repository';

@Injectable()
export class AutocompleteService {
  constructor(
    private readonly recetaRepo: RecetaRepository,
    private readonly insumoRepo: InsumoRepository
  ) {}

  async autocompleteProducto(codigo: string) {
    // Buscar en productos (recetas)
    const producto = await this.recetaRepo.buscarProducto(codigo);
    return {
      descripcion: producto?.descripcion_producto || '',
      sector: producto?.sector_productivo || ''
    };
  }

  async autocompleteIngrediente(codigo: string) {
    // 1. Buscar en productos (recetas)
    const producto = await this.recetaRepo.buscarProducto(codigo);
    if (producto) {
      return { descripcion: producto.descripcion_producto };
    }

    // 2. Buscar en insumos
    const insumo = await this.insumoRepo.buscarPorCodigo(codigo);
    if (insumo) {
      return { descripcion: insumo.detalle };
    }

    return { descripcion: '' };
  }
}