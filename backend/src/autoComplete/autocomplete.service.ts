import { Injectable, Inject, Scope } from '@nestjs/common';
import { Request } from 'express';
import { ProductoRepository } from '../productos/producto.repository';
import { InsumoRepository } from '../insumo/insumo.repository';
import { MatrizManoRepository } from '../matrizMano/matiz-mano.repository';
import { MatrizEnergiaRepository } from '../matrizEnergia/matiz-energia.repository';

type PlantaScope = 'catamarca' | 'varela' | null;

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

  /**
   * Autocomplete de ingrediente.
   * - Productos son globales → no filtran por planta.
   * - Insumos / MO / Energía son por-planta. Si se pasa `planta`, solo
   *   matchean si el código existe en esa planta. Si existe en otra,
   *   devuelve un campo `error` con mensaje claro.
   */
  async autocompleteIngrediente(codigo: string, planta?: string) {
    const plantaScope: PlantaScope =
      planta === 'catamarca' || planta === 'varela' ? planta : null;

    // 1) Producto → global
    const producto = await this.productoRepo.obtenerPorCodigo(codigo);
    if (producto) {
      return { descripcion: producto.descripcion_producto || 'Ingrediente no encontrado' };
    }

    // 2) Insumos → todos, después filtramos
    const insumosTodos = await this.insumoRepo.buscarPorFiltros({ codigo, planta: null });
    const insumoEnPlanta = plantaScope
      ? insumosTodos.find(i => i.planta === plantaScope)
      : insumosTodos[0];
    if (insumoEnPlanta) {
      return { descripcion: insumoEnPlanta.detalle || 'Ingrediente no encontrado' };
    }
    if (plantaScope && insumosTodos.length > 0) {
      return {
        descripcion: '',
        error: `El insumo ${codigo} pertenece a la planta ${insumosTodos[0].planta} y no puede usarse en una receta de planta ${plantaScope}.`,
      };
    }

    // 3) MO
    const manosTodas = await this.matrizManoRepo.obtenerTodasPorCodigo(codigo);
    const manoEnPlanta = plantaScope
      ? manosTodas.find(m => m.planta === plantaScope)
      : manosTodas[0];
    if (manoEnPlanta) {
      return { descripcion: manoEnPlanta.descripcion || 'Ingrediente no encontrado' };
    }
    if (plantaScope && manosTodas.length > 0) {
      return {
        descripcion: '',
        error: `La mano de obra ${codigo} pertenece a la planta ${manosTodas[0].planta} y no puede usarse en una receta de planta ${plantaScope}.`,
      };
    }

    // 4) Energía
    const energiasTodas = await this.matrizEnergiaRepo.obtenerTodasPorCodigo(codigo);
    const energiaEnPlanta = plantaScope
      ? energiasTodas.find(e => e.planta === plantaScope)
      : energiasTodas[0];
    if (energiaEnPlanta) {
      return { descripcion: energiaEnPlanta.descripcion || 'Ingrediente no encontrado' };
    }
    if (plantaScope && energiasTodas.length > 0) {
      return {
        descripcion: '',
        error: `La energía ${codigo} pertenece a la planta ${energiasTodas[0].planta} y no puede usarse en una receta de planta ${plantaScope}.`,
      };
    }

    return { descripcion: '' };
  }
}
