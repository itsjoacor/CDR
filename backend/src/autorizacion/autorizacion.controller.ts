import {
  Controller,
  Post,
  Body,
  Get,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AutorizacionService } from './autorizacion.service';

@Controller('autorizacion')
export class AutorizacionController {
  constructor(private autorizacionService: AutorizacionService) {}

  @Post('login')
  async login(
    @Body() dto: { correo: string; contrasenia: string },
  ) {
    try {
      const token = await this.autorizacionService.login(
        dto.correo,
        dto.contrasenia,
      );

      return {
        mensaje: 'Login exitoso',
        token,
      };
    } catch (e) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
  }

  @Get('verificarSesion')
  async verificarSesion(@Req() req: Request) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no presente');
    }

    const token = authHeader.split(' ')[1];
    const valido = this.autorizacionService.verificarSesion(token);

    if (!valido) {
      throw new UnauthorizedException('Token inválido');
    }

    return { logueado: true };
  }
}
