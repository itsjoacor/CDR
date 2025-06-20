import { Controller, Get, Param } from '@nestjs/common';
import { AutocompleteService } from './autocomplete.service';

@Controller('api/autocomplete') // Added 'api/' prefix
export class AutocompleteController {
  constructor(private readonly service: AutocompleteService) {}

  @Get('producto/:codigo')
  async autocompleteProducto(@Param('codigo') codigo: string) {
    try {
      const result = await this.service.autocompletarProducto(codigo);
      return result;
    } catch (error) {
      return { descripcion: '', sector: '' };
    }
  }

  @Get('ingrediente/:codigo')
  async autocompleteIngrediente(@Param('codigo') codigo: string) {
    try {
      const result = await this.service.autocompletarIngrediente(codigo);
      return result;
    } catch (error) {
      return { descripcion: '' };
    }
  }
}