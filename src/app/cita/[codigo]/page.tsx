// Página /cita/[codigo]. Los corchetes significan que esa parte de la
// dirección cambia: /cita/abc123 muestra la cita con código "abc123".
import Link from "next/link";
import { CalendarDays, Check, Scissors, User } from "lucide-react";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatoFechaLarga, formatoHora, formatoPesos } from "@/lib/formato";
import { cancelarCita } from "./acciones";
import { nombreEstado, type EstadoCita } from "@/lib/estados";
import FondoFoto from "@/components/FondoFoto";

export const dynamic = "force-dynamic";

type Cita = {
  servicio: string;
  precio: number;
  estilista: string;
  cliente: string;
  inicio: string;
  fin: string;
  estado: EstadoCita;
};

export default async function PaginaCita({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const supabase = await crearClienteServidor();
  const { data } = await supabase.rpc("ver_cita", { p_codigo: codigo });
  const cita = (data as Cita[] | null)?.[0];

  if (!cita) {
    return (
      <main className="publico mx-auto max-w-md px-4 py-10">
        <FondoFoto />
        <h1 className="text-2xl font-bold">No encontramos esta cita</h1>
        <Link href="/" className="mt-4 inline-block underline">
          Volver al inicio
        </Link>
      </main>
    );
  }

  const sePuedeCancelar = cita.estado === "confirmada" && new Date(cita.inicio) > new Date();

  return (
    <main className="publico mx-auto max-w-md px-4 py-10">
      <FondoFoto />
      {cita.estado === "confirmada" && (
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black">
          <Check size={30} strokeWidth={3} />
        </span>
      )}
      <h1 className="mt-4 text-3xl font-bold uppercase">
        {cita.estado === "confirmada" ? `¡Listo, ${cita.cliente}!` : "Tu cita"}
      </h1>
      <p className="mt-1 text-sm text-suave">Guarda este enlace para ver o cancelar tu cita.</p>

      <div className="mt-6 space-y-2 rounded-xl border border-borde bg-tarjeta p-4">
        <p className="text-xs font-semibold tracking-widest text-suave uppercase">
          {nombreEstado[cita.estado]}
        </p>
        <p className="flex items-center justify-between text-lg font-semibold">
          <span className="flex items-center gap-2">
            <Scissors size={18} className="text-suave" />
            {cita.servicio}
          </span>
          {formatoPesos(cita.precio)}
        </p>
        <p className="flex items-center gap-2">
          <User size={18} className="text-suave" />
          con {cita.estilista}
        </p>
        <p className="flex items-center gap-2">
          <CalendarDays size={18} className="text-suave" />
          {formatoFechaLarga(cita.inicio)}, {formatoHora(cita.inicio)}
        </p>
      </div>

      {sePuedeCancelar && (
        // .bind() le pasa el código a la acción cuando se presiona el botón.
        <form action={cancelarCita.bind(null, codigo)} className="mt-6">
          <button className="w-full rounded-xl border border-red-500/70 py-3 font-semibold text-red-400">
            Cancelar cita
          </button>
        </form>
      )}

      <Link href="/" className="mt-6 inline-block text-sm text-suave underline">
        Volver al inicio
      </Link>
    </main>
  );
}
