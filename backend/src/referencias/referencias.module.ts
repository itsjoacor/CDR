import { Module, Scope } from '@nestjs/common';
import { ReferenciasController } from './referencias.controller';
import { ReferenciasService } from './referencias.service';
import { ReferenciasRepository } from './referencias.repository';
import { REQUEST } from '@nestjs/core';

@Module({
  controllers: [ReferenciasController],
  providers: [
    ReferenciasService,
    {
      provide: 'REQUEST',
      scope: Scope.REQUEST,
      useFactory: (req: any) => req,
    },
    ReferenciasRepository,
  ],
  exports: [ReferenciasService],
})
export class ReferenciasModule {}
