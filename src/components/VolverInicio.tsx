import Link from "next/link";
import { ChevronLeft } from "lucide-react";

// Botón para volver a la portada. Va en blanco y con borde para que se vea
// bien encima de la foto de fondo.
export default function VolverInicio({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-1 rounded-full border border-white/40 bg-black/40 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10 ${className}`}
    >
      <ChevronLeft size={16} />
      Volver al inicio
    </Link>
  );
}
