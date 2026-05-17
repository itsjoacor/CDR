import { Injectable, Inject, Scope } from '@nestjs/common';
import { Request } from 'express';
import { SectorProductivo } from '../sectorProductivo/sectores-productivos.model';
import { SectorProductivoRepository } from '../sectorProductivo/sectores-productivos.repository';
import { validarPlantaEscritura } from '../config/planta.helper';

@Injectable({ scope: Scope.REQUEST })
export class SectorProductivoService {
  constructor(
    private readonly sectorProductivoRepository: SectorProductivoRepository,
    @Inject('REQUEST') private readonly request: Request,
  ) { }

  async crear(sector: SectorProductivo & { planta?: string; porcentaje_mantencion?: number }): Promise<SectorProductivo> {
    const planta = validarPlantaEscritura(sector.planta ?? 'catamarca');
    // PK compuesta: (nombre, planta) — un mismo nombre puede existir en ambas plantas
    const existe = await this.sectorProductivoRepository.obtenerPorNombre(sector.nombre, planta);
    if (existe) {
      throw new Error(`Ya existe un sector productivo "${sector.nombre}" en planta ${planta}`);
    }
    return this.sectorProductivoRepository.crear(Object.assign(sector, { planta }) as any);
  }

  async obtenerTodos(planta?: 'catamarca' | 'varela' | null): Promise<SectorProductivo[]> {
    return this.sectorProductivoRepository.obtenerTodos(planta);
  }

  async obtenerPorNombre(nombre: string, planta?: 'catamarca' | 'varela'): Promise<SectorProductivo | null> {
    return this.sectorProductivoRepository.obtenerPorNombre(nombre, planta);
  }

  // === V2 ===
  listarSectoresMantencionV2(planta?: 'catamarca' | 'varela' | null) {
    return this.sectorProductivoRepository.listarSectoresMantencionV2(planta);
  }

  getPorcentajeMantencionV2(nombre: string, planta: string) {
    return this.sectorProductivoRepository.getPorcentajeMantencionV2(nombre, validarPlantaEscritura(planta));
  }

  updatePorcentajeMantencionV2(nombre: string, planta: string, porcentaje: number) {
    return this.sectorProductivoRepository.updatePorcentajeMantencionV2(nombre, validarPlantaEscritura(planta), porcentaje);
  }
}
