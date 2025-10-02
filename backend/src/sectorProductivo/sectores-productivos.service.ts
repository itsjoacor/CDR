import { Injectable, Inject, Scope } from '@nestjs/common';
import { Request } from 'express';
import { SectorProductivo } from '../sectorProductivo/sectores-productivos.model';
import { SectorProductivoRepository } from '../sectorProductivo/sectores-productivos.repository';

@Injectable({ scope: Scope.REQUEST })
export class SectorProductivoService {
  constructor(
    private readonly sectorProductivoRepository: SectorProductivoRepository,
    @Inject('REQUEST') private readonly request: Request
  ) { }

  async crear(sector: SectorProductivo): Promise<SectorProductivo> {
    const existe = await this.sectorProductivoRepository.obtenerPorNombre(sector.nombre);
    if (existe) {
      throw new Error('Ya existe un sector productivo con este nombre');
    }
    return this.sectorProductivoRepository.crear(sector);
  }

  async obtenerTodos(): Promise<SectorProductivo[]> {
    return this.sectorProductivoRepository.obtenerTodos();
  }

  async obtenerPorNombre(nombre: string): Promise<SectorProductivo | null> {
    return this.sectorProductivoRepository.obtenerPorNombre(nombre);
  }

  // === V2: passthrough a repositorio (no rompe lo anterior) ===
  listarSectoresMantencionV2() {
    return this.sectorProductivoRepository.listarSectoresMantencionV2();
  }

  getPorcentajeMantencionV2(nombre: string) {
    return this.sectorProductivoRepository.getPorcentajeMantencionV2(nombre);
  }

  updatePorcentajeMantencionV2(nombre: string, porcentaje: number) {
    return this.sectorProductivoRepository.updatePorcentajeMantencionV2(nombre, porcentaje);
  }

}