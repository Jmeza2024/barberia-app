// Página /panel/nueva-cita: agendar a alguien que llamó o que llegó al local.
import Link from "next/link";
import { obtenerPerfil } from "@/lib/sesion";
import { hoyEnBogota, ZONA_HORARIA } from "@/lib/formato";
import FormularioCita from "./FormularioCita";

export default async function PaginaNuevaCita({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { fecha: fechaParametro } = await searchParams;
  const { supabase, perfil } = await obtenerPerfil();
  const esDueno = perfil?.rol === "dueno";
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(fechaParametro ?? "") ? fechaParametro! : hoyEnBogota();

  const [{ data: servicios }, { data: barberos }] = await Promise.all([
    supabase.from("servicios").select("id, nombre, precio, duracion_min").eq("activo", true).order("nombre"),
    esDueno
      ? supabase.from("estilistas").select("id, nombre").eq("activo", true).order("nombre")
      : Promise.resolve({ data: null }),
  ]);

  // Hora sugerida: la próxima hora en punto o y media (para quien llega ya).
  const ahora = new Date();
  ahora.setMinutes(ahora.getMinutes() < 30 ? 30 : 60, 0, 0);
  const horaSugerida = ahora.toLocaleTimeString("en-GB", {
    timeZone: ZONA_HORARIA,
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section className="max-w-md">
      <Link href={`/panel?fecha=${fecha}`} className="text-sm underline">
        ← Volver a la agenda
      </Link>
      <h1 className="mt-3 text-2xl font-bold">Nueva cita</h1>
      <p className="mt-1 text-sm opacity-70">Para quien llama o llega al local.</p>
      <FormularioCita
        servicios={servicios ?? []}
        barberos={barberos}
        fecha={fecha}
        horaSugerida={horaSugerida}
      />
    </section>
  );
}
