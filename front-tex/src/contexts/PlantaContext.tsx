import React, { createContext, useContext, useEffect, useState } from 'react';

export type PlantaView = 'catamarca' | 'varela' | 'all';

interface PlantaContextValue {
  planta: PlantaView;
  setPlanta: (p: PlantaView) => void;
  /** Query-param para enviar al backend ('catamarca'|'varela'|'all') */
  plantaParam: string;
  /** Helper para forms: si planta === 'all', no podés escribir → devuelve null */
  plantaParaEscritura: 'catamarca' | 'varela' | null;
  /** Etiqueta legible */
  plantaLabel: string;
  /** Color asociado para badges */
  plantaColor: string;
}

const STORAGE_KEY = 'texcdr_planta_seleccionada';

const PlantaContext = createContext<PlantaContextValue | undefined>(undefined);

export const PlantaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [planta, setPlantaState] = useState<PlantaView>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as PlantaView | null;
      if (saved && ['catamarca', 'varela', 'all'].includes(saved)) return saved;
    } catch { /* ignore */ }
    return 'catamarca'; // default — todo lo histórico es catamarca
  });

  const setPlanta = (p: PlantaView) => {
    setPlantaState(p);
    try { localStorage.setItem(STORAGE_KEY, p); } catch { /* ignore */ }
  };

  const plantaLabel = planta === 'all' ? 'Ambas Plantas' : planta === 'catamarca' ? 'Catamarca' : 'Varela';
  const plantaColor = planta === 'catamarca' ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : planta === 'varela' ? 'bg-sky-100 text-sky-800 border-sky-300'
                    : 'bg-slate-100 text-slate-800 border-slate-300';

  // Param para query strings
  const plantaParam = planta;

  // Para forms: si está en 'all' no podés escribir, hay que elegir explícito
  const plantaParaEscritura = planta === 'all' ? null : planta;

  return (
    <PlantaContext.Provider value={{ planta, setPlanta, plantaParam, plantaParaEscritura, plantaLabel, plantaColor }}>
      {children}
    </PlantaContext.Provider>
  );
};

export const usePlanta = (): PlantaContextValue => {
  const ctx = useContext(PlantaContext);
  if (!ctx) throw new Error('usePlanta debe usarse dentro de <PlantaProvider>');
  return ctx;
};
