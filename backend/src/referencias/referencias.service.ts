import { Injectable, Scope } from '@nestjs/common';
import { ReferenciasRepository } from './referencias.repository';

@Injectable({ scope: Scope.REQUEST })
export class ReferenciasService {
  constructor(private readonly repo: ReferenciasRepository) {}

  async obtenerNombres(codigos: string[]) {
    // Llama al repositorio, devuelve un map código -> descripción
    return this.repo.buscarDescripcionesPorCodigos(codigos);
  }
}
