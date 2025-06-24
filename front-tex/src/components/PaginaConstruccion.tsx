import { Link } from 'react-router-dom'; // o usa <a href="/"> si no usás router

const PaginaEnProduccion = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-purple-50 text-center px-4">
      <div className="bg-white border border-purple-200 rounded-2xl p-8 shadow-md max-w-md">
        <p className="text-lg font-semibold text-purple-800 mb-4">
          🚧 Página en construcción!
        </p>
        <p className="text-sm text-purple-700 mb-6">
          Estamos trabajando para brindarte una mejor experiencia. Disculpá las molestias.
        </p>
        <Link
          to="/"
          className="inline-block bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors px-4 py-2 rounded-full font-medium text-sm"
        >
          ⬅️ Volver al inicio
        </Link>
      </div>
    </div>
  );
};

export default PaginaEnProduccion;
