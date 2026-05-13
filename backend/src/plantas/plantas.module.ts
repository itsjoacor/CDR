import { Module } from '@nestjs/common';
import { PlantasController } from './plantas.controller';
import { PlantasService } from './plantas.service';

@Module({
  controllers: [PlantasController],
  providers: [PlantasService],
  exports: [PlantasService],
})
export class PlantasModule {}
