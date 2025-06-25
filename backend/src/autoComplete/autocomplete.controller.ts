// src/autocomplete/autocomplete.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { AutocompleteService } from './autocomplete.service';

@Controller('api/autocomplete')
export class AutocompleteController {
  constructor(private readonly autocompleteService: AutocompleteService) {}

  @Get('producto/:codigo')
  getProducto(@Param('codigo') codigo: string) {
    return this.autocompleteService.autocompleteProducto(codigo);
  }

  @Get('ingrediente/:codigo')
  getIngrediente(@Param('codigo') codigo: string) {
    return this.autocompleteService.autocompleteIngrediente(codigo);
  }
}
