// src/autocomplete/autocomplete.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { AutocompleteService } from './autocomplete.service';

@Controller('api/autocomplete')
export class AutocompleteController {
  constructor(private readonly service: AutocompleteService) {}

  @Get('producto/:codigo')
  async autocompleteProducto(@Param('codigo') codigo: string) {
    return this.service.autocompleteProducto(codigo);
  }

  @Get('ingrediente/:codigo')
  async autocompleteIngrediente(@Param('codigo') codigo: string) {
    return this.service.autocompleteIngrediente(codigo);
  }
}