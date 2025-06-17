import { Module } from '@nestjs/common';
import { AutorizacionController } from './autorizacion.controller';
import { AutorizacionService } from './autorizacion.service';
import { JwtModule } from '@nestjs/jwt';


@Module({
    imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AutorizacionController],
  providers: [AutorizacionService],
  exports: [JwtModule],
})
export class AutorizacionModule {}