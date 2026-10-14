// Página /panel: la agenda de un día. Gracias a las reglas de seguridad (RLS),
// la misma consulta le trae al barbero solo sus citas y al dueño todas.
//
// El día y el barbero elegidos viajan en la dirección (searchParams), por
// ejemplo /panel?fecha=2026-10-12&barbero=abc. Así los botones de "día
// anterior" y "día siguiente" son simples enlaces.
import Link from "next/link";
import { Bell, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { obtenerPerfil } from "@/lib/sesion";
import {
  enlaceWhatsApp,
  formatoFechaLarga,
  formatoHora,
  hoyEnBogota,
  sumarDias,
} from "@/lib/formato";
import { colorEstado, nombreEstado, type EstadoCita } from "@/lib/estados";

type CitaAgenda = {
  id: string;
  inicio: string;
  fin: string;
  estado: EstadoCita;
  nota: string | null;
  servicios: { nombre: string } | null;
  clientes: { nombre: string; telefono: string } | null;
  estilistas: { id: string; nombre: string } | null;
};

const esFecha = (texto?: string) => !!texto && /^\d{4}-\d{2}-\d{2}$/.test(texto);

export default async function PanelAgenda({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; barbero?: string }>;
}) {
  const parametros = await searchParams;
  const { supabase, perfil } = await obtenerPerfil();
  const esDueno = perfil?.rol === "dueno";
  const hoy = hoyEnBogota();
  const fecha = esFecha(parametros.fecha) ? parametros.fecha! : hoy;
  const barbero = esDueno ? parametros.barbero : undefined;

  // Bogotá está en UTC-5 todo el año (no cambia de hora).
  let consulta = supabase
    .from("citas")
    .select(
      "id, inicio, fin, estado, nota, servicios(nombre), clientes(nombre, telefono), estilistas(id, nombre)",
    )
    .gte("inicio", `${fecha}T00:00:00-05:00`)
    .lt("inicio", `${sumarDias(fecha, 1)}T00:00:00-05:00`)
    .order("inicio");
  if (barbero) consulta = consulta.eq("estilista_id", barbero);

  const manana = sumarDias(hoy, 1);
  const [{ data: citas }, { data: barberos }, { count: recordatoriosPendientes }] = await Promise.all([
    consulta.returns<CitaAgenda[]>(),
    esDueno
      ? supabase.from("estilistas").select("id, nombre").eq("activo", true).order("nombre")
      : Promise.resolve({ data: null }),
    // Cuántas citas de mañana no tienen recordatorio todavía.
    supabase
      .from("citas")
      .select("id", { count: "exact", head: true })
      .eq("estado", "confirmada")
      .eq("recordatorio_enviado", false)
      .gte("inicio", `${manana}T00:00:00-05:00`)
      .lt("inicio", `${sumarDias(manana, 1)}T00:00:00-05:00`),
  ]);

  const activas = citas?.filter((c) => c.estado !== "cancelada") ?? [];
  const canceladas = citas?.filter((c) => c.estado === "cancelada") ?? [];

  // Arma un enlace a la misma página cambiando solo el día.
  const enlaceDia = (dia: string) =>
    `/panel?fecha=${dia}${barbero ? `&barbero=${barbero}` : ""}`;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {fecha === hoy ? "Hoy" : formatoFechaLarga(`${fecha}T12:00:00-05:00`)}
          </h1>
          <p className="mt-1 text-sm text-suave">
            {activas.length ? `${activas.length} cita(s)` : "No hay citas"}
          </p>
        </div>
        <Link
          href={`/panel/nueva-cita?fecha=${fecha}`}
          className="flex items-center gap-1.5 rounded-xl boton-plata px-4 py-3 text-sm font-semibold text-black"
        >
          <Plus size={18} />
          Nueva cita
        </Link>
      </div>

      {!!recordatoriosPendientes && (
        <Link
          href="/panel/recordatorios"
          className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-950/60 p-3 text-sm text-emerald-200"
        >
          <Bell size={16} />
          Mañana hay {recordatoriosPendientes} cita(s) sin recordatorio. <strong>Enviar →</strong>
        </Link>
      )}

      {/* Cambiar de día */}
      <nav className="mt-4 flex items-center gap-2 text-sm">
        <Link
          href={enlaceDia(sumarDias(fecha, -1))}
          className="flex items-center gap-1 rounded-lg border border-borde bg-tarjeta px-3 py-2"
        >
          <ChevronLeft size={16} />
          Anterior
        </Link>
        {fecha !== hoy && (
          <Link href={enlaceDia(hoy)} className="rounded-lg border border-borde bg-tarjeta px-3 py-2">
            Hoy
          </Link>
        )}
        <Link
          href={enlaceDia(sumarDias(fecha, 1))}
          className="flex items-center gap-1 rounded-lg border border-borde bg-tarjeta px-3 py-2"
        >
          Siguiente
          <ChevronRight size={16} />
        </Link>
      </nav>

      {/* Solo el dueño: ver la agenda de un barbero. Cada "chip" es un enlace
          que cambia el ?barbero= de la dirección. */}
      {esDueno && barberos && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 text-sm">
          {[{ id: "", nombre: "Todos" }, ...barberos].map((b) => {
            const elegido = (barbero ?? "") === b.id;
            return (
              <Link
                key={b.id || "todos"}
                href={`/panel?fecha=${fecha}${b.id ? `&barbero=${b.id}` : ""}`}
                className={`shrink-0 rounded-full border px-4 py-1.5 ${
                  elegido ? "border-white bg-white text-black" : "border-borde bg-tarjeta text-suave"
                }`}
              >
                {b.nombre}
              </Link>
            );
          })}
        </div>
      )}

      <ul className="mt-6 space-y-2">
        {[...activas, ...canceladas].map((cita) => (
          <li key={cita.id}>
            <div
              className={`flex items-start justify-between gap-3 rounded-xl border border-borde bg-tarjeta p-4 ${
                cita.estado === "cancelada" ? "opacity-50" : ""
              }`}
            >
              <Link href={`/panel/cita/${cita.id}`} className="flex-1">
                <p className="font-semibold">
                  {formatoHora(cita.inicio)} – {formatoHora(cita.fin)}
                </p>
                <p className="text-sm">
                  {cita.clientes?.nombre} · {cita.servicios?.nombre}
                </p>
                {esDueno && <p className="text-xs text-suave">con {cita.estilistas?.nombre}</p>}
                {cita.nota && <p className="mt-1 text-xs italic text-suave">“{cita.nota}”</p>}
              </Link>
              <div className="flex flex-col items-end gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorEstado[cita.estado]}`}>
                  {nombreEstado[cita.estado]}
                </span>
                {cita.clientes && (
                  <a href={enlaceWhatsApp(cita.clientes.telefono)} className="text-xs underline">
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {!!citas?.length && (
        <p className="mt-4 text-xs text-suave">Toca una cita para atenderla, cambiarla o cancelarla.</p>
      )}
    </section>
  );
}
