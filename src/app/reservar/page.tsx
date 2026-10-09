// Página /reservar. El servidor trae los servicios y los barberos, y se los
// pasa al componente <Reserva>, que corre en el celular y maneja los pasos.
import { crearClienteServidor } from "@/lib/supabase/server";
import Reserva from "./Reserva";

export const dynamic = "force-dynamic";

export default async function PaginaReservar() {
  const supabase = await crearClienteServidor();

  const [servicios, estilistas, relacion, negocio] = await Promise.all([
    supabase
      .from("servicios")
      .select("id, nombre, categoria, precio, duracion_min")
      .eq("activo", true)
      .order("categoria")
      .order("precio"),
    supabase.from("estilistas_publicos").select("id, nombre, foto_url").order("nombre"),
    supabase.from("estilista_servicios").select("estilista_id, servicio_id"),
    supabase.from("negocio").select("dias_para_reservar").single(),
  ]);

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-2xl font-bold">Reservar cita</h1>
      <Reserva
        servicios={servicios.data ?? []}
        estilistas={estilistas.data ?? []}
        relacion={relacion.data ?? []}
        diasParaReservar={negocio.data?.dias_para_reservar ?? 14}
      />
    </main>
  );
}
