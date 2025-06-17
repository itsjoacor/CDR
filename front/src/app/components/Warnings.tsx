import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface InfoProps {
  texto: string;
  rutaDestino: string;
  setInfo: React.Dispatch<React.SetStateAction<boolean>>;
}

const Warning: React.FC<InfoProps> = ({ texto, rutaDestino, setInfo }) => {
  const [presionado, setPresionado] = useState(false);
  const router = useRouter();

  const quitarComponente = () => {
    setPresionado(true);
    setInfo(false);
    setTimeout(() => {
      if (rutaDestino != "") {
        router.push(rutaDestino);
      }
    }, 300); // Tiempo de espera reducido para mejor experiencia
  };

  return (
    <div className="fixed inset-0 z-[999]">
      {/* Fondo difuminado */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={quitarComponente}
      />
      
      {/* Tarjeta de información */}
      <div
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-xl shadow-xl z-[1000] overflow-hidden transition-all duration-300 ${
          presionado ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        <div className="p-6 text-center">
          {/* Botón de cierre */}
          <button
            onClick={quitarComponente}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
          
          {/* Contenido */}
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100 mb-4">
              <svg
                className="h-6 w-6 text-rose-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {texto}
            </h3>
          </div>
          
          {/* Botón de acción */}
          <div className="flex justify-center">
            <button
              onClick={quitarComponente}
              className="px-6 py-2 bg-rose-500 text-white font-medium rounded-lg hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Warning;