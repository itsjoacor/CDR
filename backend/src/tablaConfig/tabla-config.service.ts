import { Injectable } from '@nestjs/common';
import { TablaConfigRepository } from './tabla-config.repository';
import { TablaConfigBodyDto } from './tabla-config.dto';

@Injectable()
export class TablaConfigService {
  constructor(private readonly repo: TablaConfigRepository) { }

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
}