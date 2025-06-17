import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { AutorizacionService } from './autorizacion.service';

@Controller('autorizacion')
export class AutorizacionController {
  constructor(private readonly service: AutorizacionService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
    return this.service.login(email, password);
  }

  @Get('verificarSesion')
  async verificarSesion(@Headers('Authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Token requerido');
    return this.service.verificarToken(token);
  }
}
