// sectores-productivos.module.ts
import { Module } from '@nestjs/common';
import { SectorProductivoController } from '../sectorProductivo/sectores-productivos.controller';
import { SectorProductivoService } from '../sectorProductivo/sectores-productivos.service';
import { SectorProductivoRepository } from '../sectorProductivo/sectores-productivos.repository';

@Module({
  controllers: [SectorProductivoController],
  providers: [SectorProductivoService, SectorProductivoRepository],
  exports: [SectorProductivoService]
})
export class SectorProductivoModule {}