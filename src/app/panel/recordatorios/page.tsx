// Página /panel/recordatorios: las citas de mañana (u otro día) para
// recordarle a cada cliente por WhatsApp. RLS hace que el barbero solo vea
// las suyas.
import Link from "next/link";
import { headers } from "next/headers";
import { obtenerPerfil } from "@/lib/sesion";
import {
  enlaceWhatsAppConMensaje,
  formatoFechaLarga,
  formatoHora,
  hoyEnBogota,
  sumarDias,
} from "@/lib/formato";
import { citasDelDia, mensajeDe } from "@/lib/recordatorios";
import { direccionSitio } from "@/lib/sitio";
import { abrirRecordatorio, marcarPendiente } from "./acciones";

const esFecha = (texto?: string) => !!texto && /^\d{4}-\d{2}-\d{2}$/.test(texto);
const estiloBotonDia = "rounded-lg border border-borde px-3 py-2";

export default async function PaginaRecordatorios({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const parametros = await searchParams;
  const { supabase, perfil } = await obtenerPerfil();
  const esDueno = perfil?.rol === "dueno";
  const manana = sumarDias(hoyEnBogota(), 1);
  const fecha = esFecha(parametros.fecha) ? parametros.fecha! : manana;

  const citas = await citasDelDia(supabase, fecha);
  const pendientes = citas.filter((c) => !c.recordatorio_enviado);
  const sitio = direccionSitio(await headers());

  return (
    <section className="max-w-xl">
      <h1 className="text-2xl font-bold">Recordatorios</h1>
      <p className="mt-1 text-sm text-suave">
        Citas de {fecha === manana ? "mañana, " : ""}
        {formatoFechaLarga(`${fecha}T12:00:00-05:00`).toLowerCase()} · {pendientes.length} por enviar
      </p>

      <nav className="mt-4 flex gap-2 text-sm">
        <Link href={`/panel/recordatorios?fecha=${sumarDias(fecha, -1)}`} className={estiloBotonDia}>
          ← Anterior
        </Link>
        {fecha !== manana && (
          <Link href="/panel/recordatorios" className={estiloBotonDia}>
            Mañana
          </Link>
        )}
        <Link href={`/panel/recordatorios?fecha=${sumarDias(fecha, 1)}`} className={estiloBotonDia}>
          Siguiente →
        </Link>
      </nav>

      <p className="mt-4 text-sm text-suave">
        Toca <strong>Enviar</strong> en cada cita: se abre WhatsApp con el mensaje listo y la cita queda
        marcada como recordada.
      </p>

      {citas.length === 0 ? (
        <p className="mt-6 text-sm text-suave">No hay citas confirmadas ese día.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {citas.map((cita) => {
            const enlace = cita.clientes
              ? enlaceWhatsAppConMensaje(cita.clientes.telefono, mensajeDe(cita, sitio).texto)
              : null;
            return (
              <li
                key={cita.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-borde bg-tarjeta p-4"
              >
                <div>
                  <p className="font-semibold">
                    {formatoHora(cita.inicio)} · {cita.clientes?.nombre}
                  </p>
                  <p className="text-sm text-suave">
                    {cita.servicios?.nombre}
                    {esDueno && ` · ${cita.estilistas?.nombre}`}
                  </p>
                </div>
                {cita.recordatorio_enviado ? (
                  <form action={marcarPendiente.bind(null, cita.id, fecha)} className="text-right">
                    <p className="text-sm font-semibold text-emerald-400">✓ Enviado</p>
                    <button className="text-xs underline text-suave">Marcar pendiente</button>
                  </form>
                ) : (
                  enlace && (
                    <form action={abrirRecordatorio.bind(null, cita.id, enlace)}>
                      <button className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
                        Enviar
                      </button>
                    </form>
                  )
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
