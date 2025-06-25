// src/autocomplete/autocomplete.service.ts
import { Injectable } from '@nestjs/common';
import { RecetaRepository } from '../receta/receta.repository';
import { InsumoRepository } from '../insumo/insumo.repository';
import { MatrizManoRepository } from '../matrizMano/matiz-mano.repository';
import { MatrizEnergiaRepository } from '../matrizEnergia/matiz-energia.repository';

@Injectable()
export class AutocompleteService {
  constructor(
    private readonly recetaRepo: RecetaRepository,
    private readonly insumoRepo: InsumoRepository,
    private readonly matrizManoRepo: MatrizManoRepository,
    private readonly matrizEnergiaRepo: MatrizEnergiaRepository,
  ) {}

  async autocompleteProducto(codigo: string) {
    const producto = await this.recetaRepo.buscarProducto(codigo);
    return {
      descripcion: producto?.descripcion_producto || '',
      sector: producto?.sector_productivo || ''
    };
  }

  async autocompleteIngrediente(codigo: string) {
    // 1. Productos
    const producto = await this.recetaRepo.buscarProducto(codigo);
    if (producto) return { descripcion: producto.descripcion_producto };

    // 2. Insumos
    const insumo = await this.insumoRepo.buscarPorCodigo(codigo);
    if (insumo) return { descripcion: insumo.detalle };

    // 3. Mano de Obra
    const mano = await this.matrizManoRepo.obtenerPorCodigo(codigo);
    if (mano) return { descripcion: mano.descripcion };

    // 4. Matriz Energética
    const energia = await this.matrizEnergiaRepo.obtenerPorCodigo(codigo);
    if (energia) return { descripcion: energia.descripcion };

    return { descripcion: '' };
  }
}
