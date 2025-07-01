// sectores-productivos.service.ts
import { Injectable } from '@nestjs/common';
import { SectorProductivo } from '../sectorProductivo/sectores-productivos.model';
import { SectorProductivoRepository } from '../sectorProductivo/sectores-productivos.repository';

@Injectable()
export class SectorProductivoService {
  constructor(private readonly sectorProductivoRepository: SectorProductivoRepository) {}

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
}