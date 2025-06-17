import { supabase } from '@/app/utils/supabase';

export default async function subirImagenesYObtenerURLs(imagenes: File[]): Promise<string[]> {
  const urls: string[] = [];

  for (const imagen of imagenes) {
    const nombreArchivo = `${Date.now()}-${imagen.name}`;
    const { data, error } = await supabase.storage.from('imagenestrabajos').upload(nombreArchivo, imagen);

    if (error) throw new Error(`Error al subir imagen: ${error.message}`);

    const { data: publicUrl } = supabase.storage.from('imagenestrabajos').getPublicUrl(nombreArchivo);

    urls.push(publicUrl.publicUrl);

  }

  return urls;
}

