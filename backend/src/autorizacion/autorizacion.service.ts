import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AutorizacionService {

  constructor(private jwtService: JwtService) {}

  async login(correo: string, contrasenia: string): Promise<string> {
    const usuarioValido =
      correo.toLowerCase().trim() === 'admin' && contrasenia === '/Fierro123';

    if (!usuarioValido) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const payload = { correo };
    return this.jwtService.sign(payload);
  }

  verificarSesion(token: string): boolean {
    try {
      this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      return true;
    } catch {
      return false;
    }
  }

}
