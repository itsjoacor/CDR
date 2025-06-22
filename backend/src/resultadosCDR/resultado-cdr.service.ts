import { Injectable } from '@nestjs/common';
import { ResultadosCdrRepository } from '../resultadosCDR/resultado-cdr.reposiroty';
import { ResultadosCdr } from './resultado-cdr.interface';

@Injectable()
export class ResultadosCdrService {
  constructor(private readonly repository: ResultadosCdrRepository) {}

  async findAll(): Promise<ResultadosCdr[]> {
    return this.repository.findAll();
  }

  async findOne(codigo_producto: string): Promise<ResultadosCdr | null> {
    return this.repository.findOne(codigo_producto);
  }

  async create(data: ResultadosCdr): Promise<void> {
    return this.repository.create(data);
  }

  async update(data: ResultadosCdr): Promise<void> {
    return this.repository.update(data);
  }

  async delete(codigo_producto: string): Promise<void> {
    return this.repository.delete(codigo_producto);
  }

  async getBaseCdr(codigo_producto: string): Promise<number | null> {
  const record = await this.repository.findOne(codigo_producto);
  return record?.base_cdr ?? null;
}

}
