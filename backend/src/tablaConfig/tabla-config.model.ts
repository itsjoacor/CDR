export type PlantaConfig = 'catamarca' | 'varela';

export interface TablaConfig {
  nombre: string;
  valor: number;
  planta: PlantaConfig;
}
