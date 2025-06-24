import { Module } from '@nestjs/common';
import { MatrizManoController } from './matriz-mano.controller';
import { MatrizManoService } from './matriz-mano.service';
import { MatrizManoRepository } from './matiz-mano.repository';

@Module({
  controllers: [MatrizManoController],
  providers: [MatrizManoService, MatrizManoRepository],
})
export class MatrizManoModule {}
