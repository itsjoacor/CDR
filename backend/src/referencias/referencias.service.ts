import { Injectable } from '@nestjs/common';
import { ReferenciasRepository } from './referencias.repository';

@Injectable()
export class ReferenciasService {
  constructor(private readonly repo: ReferenciasRepository) {}

  async obtenerNombres(codigos: string[]) {
    // Llama al repositorio, devuelve un map código -> descripción
    return this.repo.buscarDescripcionesPorCodigos(codigos);
  }
}
