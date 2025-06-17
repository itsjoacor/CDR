import { Module } from '@nestjs/common';
import { AutorizacionService } from './autorizacion.service';
import { AutorizacionController } from './autorizacion.controller';

@Module({
  controllers: [AutorizacionController],
  providers: [AutorizacionService],
})
export class AutorizacionModule {}
