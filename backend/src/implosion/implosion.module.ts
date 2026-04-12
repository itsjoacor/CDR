import { Module } from '@nestjs/common';
import { ImplosionController } from './implosion.controller';
import { ImplosionService } from './implosion.service';

@Module({
  controllers: [ImplosionController],
  providers: [ImplosionService],
})
export class ImplosionModule {}
