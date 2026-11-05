// Página /panel/horario: el dueño cambia a qué hora abre, descansa y cierra
// cada día. Cualquiera del equipo puede cerrar un día (el barbero solo los
// suyos) y avisarles por WhatsApp a los clientes que tenían cita.
import { headers } from "next/headers";
import { obtenerPerfil } from "@/lib/sesion";
import { direccionSitio } from "@/lib/sitio";
import { mensajeCancelada } from "@/lib/mensajes";
import {
  enlaceWhatsAppConMensaje,
  fechaEnBogota,
  formatoFechaLarga,
  formatoHora,
  formatoHoraSola,
  hoyEnBogota,
} from "@/lib/formato";
import Aviso from "@/components/Aviso";
import { abrirDia, cerrarDia, guardarHorario } from "./acciones";

type DiaHorario = {
  dia_semana: number;
  abierto: boolean;
  abre: string;
  cierra: string;
  descanso_inicio: string | null;
  descanso_fin: string | null;
};

type Bloqueo = { estilista_id: string; inicio: string; fin: string; motivo: string | null };

type Cancelada = {
  id: string;
  inicio: string;
  codigo_cancelacion: string;
  estilista_id: string;
  clientes: { nombre: string; telefono: string };
  servicios: { nombre: string };
  estilistas: { nombre: string };
};

const NOMBRES_DIA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
// Lunes primero, como se ve en un calendario.
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];
const UN_DIA = 24 * 60 * 60 * 1000;

const estiloCampo = "rounded-lg border border-borde bg-transparent p-2";
const corta = (hora: string | null) => (hora ?? "").slice(0, 5);

// Horas cada media hora, de 5:00 a. m. a 11:30 p. m., escritas en formato de 12 horas.
const HORAS = Array.from({ length: 38 }, (_, i) => {
  const minutos = 5 * 60 + i * 30;
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${minutos % 60 ? "30" : "00"}`;
});

function SelectorHora({ nombre, valor }: { nombre: string; valor: string }) {
  // Si la base tiene una hora que no está en la lista (ej. 8:15), se agrega para no perderla.
  const opciones = HORAS.includes(valor) ? HORAS : [...HORAS, valor].sort();
  return (
    <select name={nombre} defaultValue={valor} className={`${estiloCampo} block w-full bg-tarjeta`}>
      {opciones.map((h) => (
        <option key={h} value={h}>
          {formatoHoraSola(h)}
        </option>
      ))}
    </select>
  );
}

export default async function PaginaHorario({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string; avisar?: string }>;
}) {
  const { aviso, avisar } = await searchParams;
  const { supabase, perfil } = await obtenerPerfil();
  const esDueno = perfil?.rol === "dueno";
  const hoy = hoyEnBogota();

  const [{ data: horario }, { data: barberos }, { data: bloqueos }] = await Promise.all([
    supabase.from("horario_negocio").select("*").order("dia_semana").returns<DiaHorario[]>(),
    supabase.from("estilistas").select("id, nombre").eq("activo", true).order("nombre"),
    supabase
      .from("bloqueos")
      .select("estilista_id, inicio, fin, motivo")
      .gte("fin", new Date().toISOString())
      .order("inicio")
      .returns<Bloqueo[]>(),
  ]);

  const nombreDe = new Map((barberos ?? []).map((b) => [b.id, b.nombre]));
  const totalBarberos = barberos?.length ?? 0;

  // Solo los días cerrados completos (los que crea "Cerrar un día"), agrupados por fecha.
  const diasCerrados = new Map<string, Bloqueo[]>();
  for (const b of bloqueos ?? []) {
    if (new Date(b.fin).getTime() - new Date(b.inicio).getTime() !== UN_DIA) continue;
    const fecha = fechaEnBogota(b.inicio);
    diasCerrados.set(fecha, [...(diasCerrados.get(fecha) ?? []), b]);
  }

  // Después de cerrar un día: las citas que se cancelaron, para avisarle a cada cliente.
  const idsAvisar = (avisar ?? "").split(",").filter((id) => /^[0-9a-f-]{36}$/.test(id));
  const canceladas = idsAvisar.length
    ? ((
        await supabase
          .from("citas")
          .select("id, inicio, codigo_cancelacion, estilista_id, clientes(nombre, telefono), servicios(nombre), estilistas(nombre)")
          .in("id", idsAvisar)
          .order("inicio")
          .returns<Cancelada[]>()
      ).data ?? [])
    : [];
  const sitio = direccionSitio(await headers());

  return (
    <section className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Horario y días libres</h1>
        <Aviso texto={aviso} />
      </div>

      {canceladas.length > 0 && (
        <div className="rounded-xl border border-borde bg-tarjeta p-4">
          <h2 className="font-semibold">Avisa a los clientes</h2>
          <p className="mt-1 text-sm text-suave">Toca cada botón para mandarle el mensaje por WhatsApp.</p>
          <ul className="mt-3 space-y-2">
            {canceladas.map((c) => {
              const mensaje = mensajeCancelada({
                cliente: c.clientes.nombre,
                servicio: c.servicios.nombre,
                barbero: c.estilistas.nombre,
                inicio: c.inicio,
                enlace: `${sitio}/cita/${c.codigo_cancelacion}`,
              });
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>
                    {formatoHora(c.inicio)} · {c.clientes.nombre} · con {c.estilistas.nombre}
                  </span>
                  <a
                    href={enlaceWhatsAppConMensaje(c.clientes.telefono, mensaje.texto)}
                    target="_blank"
                    className="rounded-lg border border-borde px-3 py-2"
                  >
                    Avisar por WhatsApp
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {esDueno && (
        <form action={guardarHorario} className="rounded-xl border border-borde bg-tarjeta p-4">
          <h2 className="font-semibold">Horario de la barbería</h2>
          <p className="mt-1 text-sm text-suave">
            Aplica para todos los barberos. Los clientes solo pueden reservar dentro de este horario.
          </p>
          <ul className="mt-4 space-y-4">
            {ORDEN_DIAS.map((dia) => {
              const h = horario?.find((x) => x.dia_semana === dia);
              return (
                <li
                  key={dia}
                  className="rounded-xl border-2 border-white/70 bg-black/30 p-4 text-sm transition-opacity has-[input[name^=abierto]:not(:checked)]:opacity-50"
                >
                  <label className="flex items-center gap-3 text-base font-semibold">
                    <input type="checkbox" name={`abierto-${dia}`} defaultChecked={h?.abierto} className="h-5 w-5" />
                    {NOMBRES_DIA[dia]}
                    <span className="ml-auto text-xs font-normal text-suave">Marcado = abre</span>
                  </label>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <label>
                      <span className="text-xs text-suave">Abre</span>
                      <SelectorHora nombre={`abre-${dia}`} valor={corta(h?.abre ?? "08:00")} />
                    </label>
                    <label>
                      <span className="text-xs text-suave">Cierra</span>
                      <SelectorHora nombre={`cierra-${dia}`} valor={corta(h?.cierra ?? "20:00")} />
                    </label>
                  </div>
                  <label className="mt-3 flex items-center gap-2 text-xs text-suave">
                    <input type="checkbox" name={`descanso-${dia}`} defaultChecked={!!h?.descanso_inicio} />
                    Tiene pausa (almuerzo)
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <label>
                      <span className="text-xs text-suave">Pausa desde</span>
                      <SelectorHora nombre={`descanso_inicio-${dia}`} valor={corta(h?.descanso_inicio ?? "12:00")} />
                    </label>
                    <label>
                      <span className="text-xs text-suave">Hasta</span>
                      <SelectorHora nombre={`descanso_fin-${dia}`} valor={corta(h?.descanso_fin ?? "13:00")} />
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-suave">
            Las citas que ya estaban reservadas no se mueven. Si cambias el horario de un día que ya tiene citas, revísalas en la agenda.
          </p>
          <button className="boton-plata mt-4 w-full rounded-xl py-3 font-semibold text-black">Guardar horario</button>
        </form>
      )}

      <form action={cerrarDia} className="space-y-3 rounded-xl border border-borde bg-tarjeta p-4 text-sm">
        <h2 className="text-base font-semibold">Cerrar un día</h2>
        <p className="text-suave">Ese día nadie podrá reservar. Sirve para festivos, permisos o vacaciones.</p>
        <label className="block">
          <span className="text-xs text-suave">Día</span>
          <input type="date" name="fecha" required min={hoy} defaultValue={hoy} className={`${estiloCampo} block w-full`} />
        </label>
        {esDueno && (
          <label className="block">
            <span className="text-xs text-suave">¿Quién no trabaja?</span>
            <select name="quien" className={`${estiloCampo} block w-full bg-tarjeta`}>
              <option value="todos">Toda la barbería</option>
              {barberos?.map((b) => (
                <option key={b.id} value={b.id}>
                  Solo {b.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="block">
          <span className="text-xs text-suave">Motivo (opcional, solo lo ve el equipo)</span>
          <input name="motivo" maxLength={100} placeholder="Ej. festivo, cita médica" className={`${estiloCampo} block w-full`} />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="cancelar" defaultChecked className="h-4 w-4" />
          Cancelar las citas que ya hay ese día
        </label>
        <button className="w-full rounded-xl border border-red-500/70 py-3 font-semibold text-red-400">Cerrar el día</button>
      </form>

      <div>
        <h2 className="font-semibold">Días cerrados</h2>
        {diasCerrados.size === 0 ? (
          <p className="mt-2 text-sm text-suave">No hay días cerrados próximos.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {[...diasCerrados].map(([fecha, lista]) => {
              const todos = esDueno && totalBarberos > 0 && lista.length >= totalBarberos;
              const grupos = todos ? [null] : lista.map((b) => b.estilista_id);
              return grupos.map((estilista) => (
                <li
                  key={`${fecha}-${estilista ?? "todos"}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-borde bg-tarjeta p-3 text-sm"
                >
                  <span>
                    <span className="font-medium">{formatoFechaLarga(`${fecha}T12:00:00-05:00`)}</span>
                    <span className="block text-xs text-suave">
                      {estilista ? `Solo ${nombreDe.get(estilista) ?? "un barbero"}` : "Toda la barbería"}
                      {lista[0]?.motivo && lista[0].motivo !== "Día cerrado" ? ` · ${lista[0].motivo}` : ""}
                    </span>
                  </span>
                  <form action={abrirDia.bind(null, fecha, estilista)}>
                    <button className="rounded-lg border border-borde px-3 py-2">Abrir otra vez</button>
                  </form>
                </li>
              ));
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
