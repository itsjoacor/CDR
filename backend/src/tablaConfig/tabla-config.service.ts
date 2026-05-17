import { Injectable, Inject, Scope } from '@nestjs/common';
import { Request } from 'express';
import { TablaConfigRepository } from './tabla-config.repository';
import { TablaConfigBodyDto } from './tabla-config.dto';
import { PlantaConfig } from './tabla-config.model';
import { validarPlantaEscritura, normalizarPlanta } from '../config/planta.helper';

@Injectable({ scope: Scope.REQUEST })
export class TablaConfigService {
  constructor(
    private readonly repo: TablaConfigRepository,
    @Inject('REQUEST') private readonly request: Request,
  ) {}

  listarTodos(planta?: string | null) {
    return this.repo.listarTodos(normalizarPlanta(planta));
  }

  obtenerUno(nombre: string, planta: string) {
    return this.repo.obtenerPorNombre(nombre, validarPlantaEscritura(planta));
  }

  crear(dto: TablaConfigBodyDto) {
    return this.repo.crear(dto);
  }

  actualizar(nombre: string, planta: string, valor: number) {
    return this.repo.actualizar(nombre, validarPlantaEscritura(planta), valor);
  }

  eliminar(nombre: string, planta: string) {
    return this.repo.eliminar(nombre, validarPlantaEscritura(planta));
  }

  // Helpers específicos por concepto
  obtenerMatrizMano(planta: string) {
    return this.repo.obtenerPorNombre('matriz_mano', validarPlantaEscritura(planta));
  }

  obtenerMatrizEnergia(planta: string) {
    return this.repo.obtenerPorNombre('matriz_energia', validarPlantaEscritura(planta));
  }

  actualizarMatrizMano(planta: string, valor: number) {
    return this.repo.actualizar('matriz_mano', validarPlantaEscritura(planta), valor);
  }

  actualizarMatrizEnergia(planta: string, valor: number) {
    return this.repo.actualizar('matriz_energia', validarPlantaEscritura(planta), valor);
  }
}
