import { Module } from '@nestjs/common';
import { ResultadosCdrController } from '../resultadosCDR/resultado-cdr.controller';
import { ResultadosCdrService } from '../resultadosCDR/resultado-cdr.service';
import { ResultadosCdrRepository } from '../resultadosCDR/resultado-cdr.reposiroty';

@Module({
  controllers: [ResultadosCdrController],
  providers: [ResultadosCdrService, ResultadosCdrRepository],
})
export class ResultadosCdrModule {}
