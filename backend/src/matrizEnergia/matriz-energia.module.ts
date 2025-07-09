import { Module } from '@nestjs/common';
import { MatrizEnergiaController } from './matriz-energia.controller';
import { MatrizEnergiaService } from './matriz-energia.service';
import { MatrizEnergiaRepository } from './matiz-energia.repository';

@Module({
  controllers: [MatrizEnergiaController],
  providers: [MatrizEnergiaService, MatrizEnergiaRepository],
})
export class MatrizEnergiaModule {}