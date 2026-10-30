// Página /tarjeta: el cliente escribe su celular y ve cuántos cortes lleva.
// No necesita cuenta: el celular con el que reserva es su tarjeta.
// El número viaja en la dirección (?tel=300...), así que es un formulario simple.
import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { crearClienteServidor } from "@/lib/supabase/server";
import FondoFoto from "@/components/FondoFoto";
import VolverInicio from "@/components/VolverInicio";
import TarjetaSellos, { type Tarjeta } from "@/components/TarjetaSellos";

export const dynamic = "force-dynamic";

type Resultado = Tarjeta & { nombre: string; gratis_reservado: boolean };

export default async function PaginaTarjeta({
  searchParams,
}: {
  searchParams: Promise<{ tel?: string }>;
}) {
  const { tel } = await searchParams;
  const supabase = await crearClienteServidor();

  const [{ data: negocio }, consulta] = await Promise.all([
    supabase.from("negocio").select("cortes_para_premio").single(),
    tel ? supabase.rpc("ver_tarjeta", { p_telefono: tel }) : Promise.resolve({ data: null }),
  ]);
  const tarjeta = (consulta.data as Resultado[] | null)?.[0];
  const meta = negocio?.cortes_para_premio ?? 10;

  return (
    <main className="publico mx-auto max-w-md px-4 py-6">
      <FondoFoto />
      <VolverInicio />
      <h1 className="mt-3 text-3xl font-bold uppercase">Mi tarjeta</h1>
      <p className="mt-1 text-sm text-suave">
        Por cada {meta} cortes, el siguiente es gratis. Escribe el celular con el que reservas.
      </p>

      <form className="mt-4 flex gap-2">
        <input
          name="tel"
          type="tel"
          inputMode="tel"
          required
          defaultValue={tel}
          placeholder="Tu celular"
          className="flex-1 rounded-lg border border-borde bg-transparent p-3"
        />
        <button className="boton-plata rounded-lg px-4 font-semibold">Ver</button>
      </form>

      {tel && !tarjeta && (
        <p className="mt-6 rounded-xl border border-borde bg-tarjeta p-4 text-sm">
          No encontramos cortes con ese número. Reserva tu primera cita y empieza a sumar.
        </p>
      )}

      {tarjeta && (
        <section className="mt-6 rounded-2xl border border-borde bg-tarjeta p-5">
          <p className="text-center text-lg font-semibold">Hola, {tarjeta.nombre}</p>
          <p className="mb-4 text-center text-sm text-suave">
            {tarjeta.gratis_reservado
              ? "Tu próxima cita ya está marcada como gratis."
              : `Llevas ${tarjeta.gratis_disponibles > 0 ? meta : tarjeta.sellos} de ${meta} cortes.`}
          </p>
          <TarjetaSellos tarjeta={tarjeta} />
          {tarjeta.gratis_disponibles > 0 && (
            <p className="mt-3 text-center text-xs text-suave">
              Se aplica solo en tu próxima reserva.
            </p>
          )}
        </section>
      )}

      <Link
        href="/reservar"
        className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-borde bg-tarjeta py-3 text-sm"
      >
        <CalendarPlus size={18} />
        Reservar cita
      </Link>
    </main>
  );
}
