// Página /ingresar: el login del dueño y los barberos.
import FormularioIngreso from "./FormularioIngreso";

export default function PaginaIngresar() {
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold">Ingreso del equipo</h1>
      <p className="mt-1 text-sm opacity-70">Para el dueño y los barberos.</p>
      <FormularioIngreso />
    </main>
  );
}
