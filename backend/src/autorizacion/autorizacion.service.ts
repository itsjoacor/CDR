import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AutorizacionService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!, // usar clave privada segura
  );

  async login(email: string, password: string) {
    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const userId = authData.user.id;

    const { data: perfil, error: perfilError } = await this.supabase
      .from('perfiles')
      .select('rol')
      .eq('id', userId)
      .single();

    if (perfilError || !perfil) {
      throw new UnauthorizedException('Perfil no encontrado');
    }

    return {
      token: authData.session.access_token,
      rol: perfil.rol,
    };
  }

  async verificarToken(token: string) {
    const { data: { user }, error } = await this.supabase.auth.getUser(token);
    if (error || !user) throw new UnauthorizedException('Token inválido');

    const { data: perfil } = await this.supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    return { rol: perfil?.rol || null };
  }
}
