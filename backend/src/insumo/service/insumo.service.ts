import { Injectable, NotFoundException } from '@nestjs/common';
import { InsumoRepository } from '../repository/insumo.repository';
import { CreateInsumoDto, UpdateInsumoDto } from '../dto/insumo-body.dto';
import { Insumo } from '../model/insumo.model';

@Injectable()
export class InsumoService {
  constructor(
    private readonly insumoRepository: InsumoRepository,
  ) {}

  async create(createInsumoDto: CreateInsumoDto): Promise<Insumo> {
    try {
      return await this.insumoRepository.guardar({
        codigo: createInsumoDto.codigo,
        grupo: createInsumoDto.grupo,
        detalle: createInsumoDto.detalle,
        costo: createInsumoDto.costo,
        getCodigo: function (): string {
          throw new Error('Function not implemented.');
        },
        getGrupo: function (): string {
          throw new Error('Function not implemented.');
        },
        getDetalle: function (): string {
          throw new Error('Function not implemented.');
        },
        getCosto: function (): number {
          throw new Error('Function not implemented.');
        },
        calcularIva: function (porcentajeIva?: number): number {
          throw new Error('Function not implemented.');
        },
        getDescripcionCompleta: function (): string {
          throw new Error('Function not implemented.');
        },
        esDeAltoCosto: function (umbral?: number): boolean {
          throw new Error('Function not implemented.');
        },
        toJSON: function (): Record<string, any> {
          throw new Error('Function not implemented.');
        }
      });
    } catch (error) {
      throw new Error(`Failed to create insumo: ${error.message}`);
    }
  }

  async findAll(): Promise<Insumo[]> {
    try {
      return await this.insumoRepository.buscarPorFiltros({});
    } catch (error) {
      throw new Error(`Failed to fetch insumos: ${error.message}`);
    }
  }

  async findOne(codigo: string): Promise<Insumo> {
    const insumo = await this.insumoRepository.buscarPorCodigo(codigo);
    if (!insumo) {
      throw new NotFoundException(`Insumo with code ${codigo} not found`);
    }
    return insumo;
  }

  async update(codigo: string, updateInsumoDto: UpdateInsumoDto): Promise<Insumo> {
    try {
      // Verify exists first
      await this.findOne(codigo);
      
      return await this.insumoRepository.actualizar(codigo, updateInsumoDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to update insumo: ${error.message}`);
    }
  }

  async remove(codigo: string): Promise<void> {
    try {
      // Verify exists first
      await this.findOne(codigo);
      await this.insumoRepository.eliminar(codigo);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to delete insumo: ${error.message}`);
    }
  }

  async buscarPorCodigo(codigo: string): Promise<Insumo | null> {
    try {
      return await this.insumoRepository.buscarPorCodigo(codigo);
    } catch (error) {
      throw new Error(`Failed to find insumo by code: ${error.message}`);
    }
  }
}