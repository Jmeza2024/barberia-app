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
import { direccionSitio, whatsappConfigurado } from "@/lib/whatsapp";
import { abrirRecordatorio, enviarTodos, marcarPendiente } from "./acciones";

const esFecha = (texto?: string) => !!texto && /^\d{4}-\d{2}-\d{2}$/.test(texto);
const estiloBotonDia = "rounded-lg border border-black/15 px-3 py-2 dark:border-white/20";

export default async function PaginaRecordatorios({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; enviados?: string; fallidos?: string }>;
}) {
  const parametros = await searchParams;
  const { supabase, perfil } = await obtenerPerfil();
  const esDueno = perfil?.rol === "dueno";
  const manana = sumarDias(hoyEnBogota(), 1);
  const fecha = esFecha(parametros.fecha) ? parametros.fecha! : manana;

  const citas = await citasDelDia(supabase, fecha);
  const pendientes = citas.filter((c) => !c.recordatorio_enviado);
  const sitio = direccionSitio(await headers());
  const automatico = whatsappConfigurado();

  return (
    <section className="max-w-xl">
      <h1 className="text-2xl font-bold">Recordatorios</h1>
      <p className="mt-1 text-sm opacity-70">
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

      {parametros.enviados !== undefined && (
        <p className="mt-4 rounded-xl bg-green-100 p-4 text-sm text-green-900">
          Se enviaron {parametros.enviados} recordatorio(s).
          {Number(parametros.fallidos) > 0 &&
            ` ${parametros.fallidos} no salieron: envíalos con su botón.`}
        </p>
      )}

      {automatico ? (
        <div className="mt-4 rounded-xl border border-black/10 p-4 text-sm dark:border-white/15">
          <p>
            <strong>Envío automático encendido.</strong> Todos los días a las 5:00 p. m. se envían solos
            los recordatorios de mañana.
          </p>
          {pendientes.length > 0 && (
            <form action={enviarTodos.bind(null, fecha)} className="mt-3">
              <button className="rounded-xl bg-green-700 px-4 py-3 font-semibold text-white">
                Enviar los {pendientes.length} que faltan ahora
              </button>
            </form>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm opacity-70">
          Toca <strong>Enviar</strong> en cada cita: se abre WhatsApp con el mensaje listo y la cita
          queda marcada como recordada.
          {esDueno && " Para que salgan solos, mira docs/aprende-etapa-8.md."}
        </p>
      )}

      {citas.length === 0 ? (
        <p className="mt-6 text-sm opacity-70">No hay citas confirmadas ese día.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {citas.map((cita) => {
            const enlace = cita.clientes
              ? enlaceWhatsAppConMensaje(cita.clientes.telefono, mensajeDe(cita, sitio).texto)
              : null;
            return (
              <li
                key={cita.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-black/10 p-4 dark:border-white/15"
              >
                <div>
                  <p className="font-semibold">
                    {formatoHora(cita.inicio)} · {cita.clientes?.nombre}
                  </p>
                  <p className="text-sm opacity-70">
                    {cita.servicios?.nombre}
                    {esDueno && ` · ${cita.estilistas?.nombre}`}
                  </p>
                </div>
                {cita.recordatorio_enviado ? (
                  <form action={marcarPendiente.bind(null, cita.id, fecha)} className="text-right">
                    <p className="text-sm font-semibold text-green-700">✓ Enviado</p>
                    <button className="text-xs underline opacity-70">Marcar pendiente</button>
                  </form>
                ) : (
                  enlace && (
                    <form action={abrirRecordatorio.bind(null, cita.id, enlace)}>
                      <button className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white">
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
