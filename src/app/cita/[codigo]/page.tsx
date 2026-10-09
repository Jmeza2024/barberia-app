// Página /cita/[codigo]. Los corchetes significan que esa parte de la
// dirección cambia: /cita/abc123 muestra la cita con código "abc123".
import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatoFechaLarga, formatoHora, formatoPesos } from "@/lib/formato";
import { cancelarCita } from "./acciones";

export const dynamic = "force-dynamic";

type Cita = {
  servicio: string;
  precio: number;
  estilista: string;
  cliente: string;
  inicio: string;
  fin: string;
  estado: "confirmada" | "atendida" | "cancelada" | "no_vino";
};

const textoEstado: Record<Cita["estado"], string> = {
  confirmada: "Confirmada",
  atendida: "Atendida",
  cancelada: "Cancelada",
  no_vino: "No asistió",
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
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-2xl font-bold">No encontramos esta cita</h1>
        <Link href="/" className="mt-4 inline-block underline">
          Volver al inicio
        </Link>
      </main>
    );
  }

  const sePuedeCancelar = cita.estado === "confirmada" && new Date(cita.inicio) > new Date();

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      {cita.estado === "confirmada" && (
        <p className="text-4xl" aria-hidden>
          ✅
        </p>
      )}
      <h1 className="mt-2 text-2xl font-bold">
        {cita.estado === "confirmada" ? `¡Listo, ${cita.cliente}!` : "Tu cita"}
      </h1>
      <p className="mt-1 text-sm opacity-70">Guarda este enlace para ver o cancelar tu cita.</p>

      <div className="mt-6 space-y-1 rounded-xl border border-black/10 p-4 dark:border-white/15">
        <p className="text-sm font-semibold">{textoEstado[cita.estado]}</p>
        <p className="text-lg font-semibold">{cita.servicio}</p>
        <p>con {cita.estilista}</p>
        <p>
          {formatoFechaLarga(cita.inicio)}, {formatoHora(cita.inicio)}
        </p>
        <p>{formatoPesos(cita.precio)}</p>
      </div>

      {sePuedeCancelar && (
        // .bind() le pasa el código a la acción cuando se presiona el botón.
        <form action={cancelarCita.bind(null, codigo)} className="mt-6">
          <button className="w-full rounded-xl border border-red-600 py-3 font-semibold text-red-600">
            Cancelar cita
          </button>
        </form>
      )}

      <Link href="/" className="mt-6 inline-block underline">
        Volver al inicio
      </Link>
    </main>
  );
}
