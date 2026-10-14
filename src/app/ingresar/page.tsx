// Página /ingresar: el login del dueño y los barberos.
import Logo from "@/components/Logo";
import FormularioIngreso from "./FormularioIngreso";
import FondoFoto from "@/components/FondoFoto";

export default function PaginaIngresar() {
  return (
    <main className="publico mx-auto max-w-sm px-4 py-16">
      <FondoFoto />
      <Logo className="w-36" />
      <h1 className="mt-4 text-3xl font-bold uppercase">Ingreso del equipo</h1>
      <p className="mt-1 text-sm text-suave">Para el dueño y los barberos.</p>
      <FormularioIngreso />
    </main>
  );
}
