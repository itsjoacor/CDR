import { Injectable, Inject, Scope } from '@nestjs/common';
import { Request } from 'express';
import { TablaConfigRepository } from './tabla-config.repository';
import { TablaConfigBodyDto } from './tabla-config.dto';

@Injectable({ scope: Scope.REQUEST })
export class TablaConfigService {
  constructor(
    private readonly repo: TablaConfigRepository,
    @Inject('REQUEST') private readonly request: Request
  ) { }

  listarTodos() {
    return this.repo.listarTodos();
  }

  obtenerUno(nombre: string) {
    return this.repo.obtenerPorNombre(nombre);
  }

  crear(dto: TablaConfigBodyDto) {
    return this.repo.crear(dto);
  }

  actualizar(nombre: string, valor: number) {
    return this.repo.actualizar(nombre, valor);
  }

  eliminar(nombre: string) {
    return this.repo.eliminar(nombre);
  }

  // Add specific methods
  actualizarMatrizEnergia(valor: number) {
    return this.repo.actualizar('matriz_energia', valor);
  }

  actualizarMatrizMano(valor: number) {
    return this.repo.actualizar('matriz_mano', valor);
  }

  obtenerMatrizEnergia() {
    return this.repo.obtenerPorNombre('matriz_energia');
  }

  obtenerMatrizMano() {
    return this.repo.obtenerPorNombre('matriz_mano');
  }
}