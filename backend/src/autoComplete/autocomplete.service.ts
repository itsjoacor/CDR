// src/autocomplete/autocomplete.service.ts
import { Injectable } from '@nestjs/common';
import { ProductoRepository } from 'src/productos/producto.repository';
import { InsumoRepository } from '../insumo/insumo.repository';
import { MatrizManoRepository } from '../matrizMano/matiz-mano.repository';
import { MatrizEnergiaRepository } from '../matrizEnergia/matiz-energia.repository';

@Injectable()
export class AutocompleteService {
  constructor(
    private readonly productoRepo: ProductoRepository,
    private readonly insumoRepo: InsumoRepository,
    private readonly matrizManoRepo: MatrizManoRepository,
    private readonly matrizEnergiaRepo: MatrizEnergiaRepository,
  ) { }

  async autocompleteProducto(codigo: string) {
    const producto = await this.productoRepo.obtenerPorCodigo(codigo);
    return {
      descripcion: producto?.descripcion_producto || '',
      sector: producto?.sector_productivo || ''
    };
  }

  async autocompleteIngrediente(codigo: string) {
    // 1. Productos 
    const producto = await this.productoRepo.obtenerPorCodigo(codigo);
    if (producto) return { descripcion: producto?.descripcion_producto || 'Ingrediente no encontrado'};


    // 2. Insumos
    const insumo = await this.insumoRepo.buscarPorCodigo(codigo);
    if (insumo) return { descripcion: insumo.detalle || 'Ingrediente no encontrado' };

    
    // 3. Mano de Obra
    const mano = await this.matrizManoRepo.obtenerPorCodigo(codigo);
    if (mano) return { descripcion: mano.descripcion || 'Ingrediente no encontrado' };


    // 4. Matriz Energética
    const energia = await this.matrizEnergiaRepo.obtenerPorCodigo(codigo);
    if (energia) return { descripcion: energia.descripcion || 'Ingrediente no encontrado' };

    return { descripcion: '' };
  }
}
