// Página /ingresar: el login del dueño y los barberos.
import { Scissors } from "lucide-react";
import FormularioIngreso from "./FormularioIngreso";
import FondoFoto from "@/components/FondoFoto";

export default function PaginaIngresar() {
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <FondoFoto />
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-borde bg-tarjeta">
        <Scissors size={24} />
      </span>
      <h1 className="mt-4 text-3xl font-bold uppercase">Ingreso del equipo</h1>
      <p className="mt-1 text-sm text-suave">Para el dueño y los barberos.</p>
      <FormularioIngreso />
    </main>
  );
}
