// Página /panel/cita/[id]: el detalle de una cita y lo que se puede hacer con ella.
//
// Para cambiarla de hora no usamos un componente de cliente: el día y el
// barbero elegidos viajan en la dirección (?fecha=...&barbero=...) y el
// servidor dibuja las horas libres. Cada hora es un botón de formulario.
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { obtenerPerfil } from "@/lib/sesion";
import {
  enlaceWhatsApp,
  enlaceWhatsAppConMensaje,
  formatoFechaLarga,
  formatoHora,
  fechaEnBogota,
  formatoPesos,
  hoyEnBogota,
  partesDeFecha,
  sumarDias,
} from "@/lib/formato";
import { colorEstado, nombreEstado, type EstadoCita } from "@/lib/estados";
import { mensajeCambiada, mensajeCancelada, mensajePremio } from "@/lib/mensajes";
import TarjetaSellos, { type Tarjeta } from "@/components/TarjetaSellos";
import { direccionSitio } from "@/lib/sitio";
import { cambiarHora, cancelarCita, marcarEstado } from "./acciones";

export const dynamic = "force-dynamic";

type Cita = {
  id: string;
  inicio: string;
  fin: string;
  estado: EstadoCita;
  nota: string | null;
  motivo_cancelacion: string | null;
  codigo_cancelacion: string;
  gratis: boolean;
  cliente_id: string;
  servicios: { id: string; nombre: string; precio: number; duracion_min: number } | null;
  clientes: { nombre: string; telefono: string } | null;
  estilistas: { id: string; nombre: string } | null;
};

const estiloBoton = "rounded-xl border border-borde bg-tarjeta px-4 py-3 text-sm font-semibold";
const esFecha = (texto?: string) => !!texto && /^\d{4}-\d{2}-\d{2}$/.test(texto);

export default async function PaginaCitaEquipo({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fecha?: string; barbero?: string; aviso?: string; error?: string }>;
}) {
  const { id } = await params;
  const parametros = await searchParams;
  const { supabase, perfil } = await obtenerPerfil();
  const esDueno = perfil?.rol === "dueno";

  const { data: cita } = await supabase
    .from("citas")
    .select(
      "id, inicio, fin, estado, nota, motivo_cancelacion, codigo_cancelacion, gratis, cliente_id, servicios(id, nombre, precio, duracion_min), clientes(nombre, telefono), estilistas(id, nombre)",
    )
    .eq("id", id)
    .maybeSingle<Cita>();

  // Si no existe o es de otro barbero, RLS no la devuelve.
  if (!cita || !cita.servicios || !cita.clientes || !cita.estilistas) notFound();

  const confirmada = cita.estado === "confirmada";
  const yaPaso = new Date(cita.inicio) < new Date();

  // ¿Está eligiendo nueva hora? Solo si la cita sigue confirmada.
  const fechaNueva = confirmada && esFecha(parametros.fecha) ? parametros.fecha! : null;
  const barberoNuevo = (esDueno && parametros.barbero) || cita.estilistas.id;

  const [{ data: horas }, { data: barberos }, { data: venta }, { data: datosTarjeta }, { data: negocio }] = await Promise.all([
    fechaNueva
      ? supabase.rpc("horas_libres_equipo", {
          p_servicio: cita.servicios.id,
          p_fecha: fechaNueva,
          p_estilista: barberoNuevo,
          p_excluir_cita: cita.id,
        })
      : Promise.resolve({ data: null }),
    esDueno && fechaNueva
      ? supabase.from("estilistas").select("id, nombre").eq("activo", true).order("nombre")
      : Promise.resolve({ data: null }),
    // Si ya se atendió, su venta (para poder abrirla).
    cita.estado === "atendida"
      ? supabase.from("ventas").select("id").eq("cita_id", cita.id).maybeSingle()
      : Promise.resolve({ data: null }),
    // La tarjeta de cortes del cliente.
    supabase.rpc("tarjeta_de", { p_cliente: cita.cliente_id }),
    supabase.from("negocio").select("cortes_para_premio").single(),
  ]);
  const tarjeta = (datosTarjeta as Tarjeta[] | null)?.[0];

  const sitio = direccionSitio(await headers());
  // Mensaje listo para avisar al cliente por WhatsApp (los textos están en src/lib/mensajes.ts).
  const datosCita = {
    cliente: cita.clientes.nombre,
    servicio: cita.servicios.nombre,
    barbero: cita.estilistas.nombre,
    inicio: cita.inicio,
    // La dirección completa de la página pública de la cita (ej. https://mibarberia.com/cita/abc).
    enlace: `${sitio}/cita/${cita.codigo_cancelacion}`,
  };
  const mensaje =
    parametros.aviso === "premio"
      ? mensajePremio({
          cliente: cita.clientes.nombre,
          meta: negocio?.cortes_para_premio ?? 10,
          enlaceReservar: `${sitio}/reservar`,
        }).texto
      : parametros.aviso === "cancelada"
      ? mensajeCancelada(datosCita).texto
      : parametros.aviso === "cambiada"
        ? mensajeCambiada(datosCita).texto
        : null;

  const dias = Array.from({ length: 15 }, (_, i) => sumarDias(hoyEnBogota(), i));

  return (
    <section className="max-w-xl">
      <Link href={`/panel?fecha=${fechaEnBogota(cita.inicio)}`} className="text-sm underline">
        ← Volver a la agenda
      </Link>

      {mensaje && (
        <div className="mt-4 rounded-xl bg-emerald-950/60 p-4 text-sm text-emerald-200">
          <p className="font-semibold">
            {parametros.aviso === "premio"
              ? `🎉 ¡${cita.clientes.nombre} completó su tarjeta! Su próximo corte es gratis. Avísale:`
              : `${parametros.aviso === "cancelada" ? "Cita cancelada." : "Cita cambiada."} Avísale al cliente:`}
          </p>
          <a
            href={enlaceWhatsAppConMensaje(cita.clientes.telefono, mensaje)}
            className="mt-2 inline-block rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white"
          >
            Enviar aviso por WhatsApp
          </a>
        </div>
      )}
      {parametros.error === "ocupada" && (
        <p className="mt-4 rounded-xl bg-red-950/60 p-4 text-sm text-red-200">
          Esa hora se acaba de ocupar. Elige otra.
        </p>
      )}

      {/* Datos de la cita */}
      <div className="mt-4 rounded-xl border border-borde bg-tarjeta p-4">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorEstado[cita.estado]}`}>
          {nombreEstado[cita.estado]}
        </span>
        <h1 className="mt-2 text-xl font-bold">{cita.clientes.nombre}</h1>
        <a href={enlaceWhatsApp(cita.clientes.telefono)} className="text-sm underline">
          {cita.clientes.telefono} · WhatsApp
        </a>
        <p className="mt-3">
          {cita.servicios.nombre} ·{" "}
          {cita.gratis ? (
            <>
              <span className="text-suave line-through">{formatoPesos(cita.servicios.precio)}</span>{" "}
              <strong>Gratis 🎁</strong>
            </>
          ) : (
            formatoPesos(cita.servicios.precio)
          )}
        </p>
        <p>
          {formatoFechaLarga(cita.inicio)}, {formatoHora(cita.inicio)} – {formatoHora(cita.fin)}
        </p>
        <p className="text-sm text-suave">con {cita.estilistas.nombre}</p>
        {cita.nota && <p className="mt-2 text-sm italic">“{cita.nota}”</p>}
        {cita.motivo_cancelacion && (
          <p className="mt-2 text-sm text-red-400">Motivo: {cita.motivo_cancelacion}</p>
        )}
      </div>

      {/* Tarjeta de cortes del cliente */}
      {tarjeta && (
        <div className="mt-4 rounded-xl border border-borde bg-tarjeta p-4">
          <p className="mb-3 text-xs font-semibold tracking-widest text-suave uppercase">
            Tarjeta de cortes · {tarjeta.gratis_disponibles > 0 ? tarjeta.meta : tarjeta.sellos} de {tarjeta.meta}
          </p>
          <TarjetaSellos tarjeta={tarjeta} pequena />
          {cita.gratis && confirmada && (
            <p className="mt-3 text-sm">Esta cita es su corte gratis: al marcarla Atendida, la venta queda en $0.</p>
          )}
        </div>
      )}

      {/* Atender: solo citas confirmadas */}
      {confirmada && (
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={marcarEstado.bind(null, cita.id, "atendida")}>
            <button className="rounded-xl boton-plata px-4 py-3 text-sm font-semibold text-black">
              ✓ Atendida
            </button>
          </form>
          {yaPaso && (
            <form action={marcarEstado.bind(null, cita.id, "no_vino")}>
              <button className={estiloBoton}>No vino</button>
            </form>
          )}
        </div>
      )}

      {/* Atendida: la venta se creó sola. Desde ahí se agregan productos o se anula. */}
      {venta && (
        <Link
          href={`/panel/ventas/${venta.id}`}
          className="mt-4 inline-block rounded-xl border border-borde bg-tarjeta px-4 py-3 text-sm font-semibold"
        >
          Ver venta · agregar productos
        </Link>
      )}

      {/* Deshacer por si se tocó por error */}
      {cita.estado === "no_vino" && (
        <form action={marcarEstado.bind(null, cita.id, "confirmada")} className="mt-4">
          <button className={estiloBoton}>Deshacer &quot;No vino&quot;</button>
        </form>
      )}

      {/* Cambiar de hora */}
      {confirmada && (
        <div className="mt-6 rounded-xl border border-borde bg-tarjeta p-4">
          <h2 className="font-semibold">Cambiar hora{esDueno ? " o barbero" : ""}</h2>

          {esDueno && barberos && fechaNueva && (
            <form className="mt-3 flex items-center gap-2 text-sm">
              <input type="hidden" name="fecha" value={fechaNueva} />
              <select
                name="barbero"
                defaultValue={barberoNuevo}
                className="rounded-lg border border-borde bg-transparent px-3 py-2"
              >
                {barberos.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
              <button className="rounded-lg border border-borde px-3 py-2">Ver horas</button>
            </form>
          )}

          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {dias.map((d) => {
              const p = partesDeFecha(d);
              const elegido = d === fechaNueva;
              return (
                <Link
                  key={d}
                  href={`/panel/cita/${cita.id}?fecha=${d}${esDueno ? `&barbero=${barberoNuevo}` : ""}`}
                  className={`min-w-14 rounded-xl border p-2 text-center ${
                    elegido
                      ? "border-white bg-white text-black"
                      : "border-borde"
                  }`}
                >
                  <span className="block text-xs capitalize">{p.diaSemana}</span>
                  <span className="block font-semibold">{p.dia}</span>
                </Link>
              );
            })}
          </div>

          {!fechaNueva ? (
            <p className="mt-2 text-sm text-suave">Elige un día para ver las horas libres.</p>
          ) : !horas?.length ? (
            <p className="mt-2 text-sm text-suave">No hay horas libres ese día.</p>
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {(horas as { inicio: string }[]).map((h) => (
                <form
                  key={h.inicio}
                  action={cambiarHora.bind(null, cita.id, barberoNuevo, h.inicio, cita.servicios!.duracion_min)}
                >
                  <button className="w-full rounded-lg border border-borde py-2 text-sm">
                    {formatoHora(h.inicio)}
                  </button>
                </form>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cancelar */}
      {confirmada && (
        <form
          action={cancelarCita.bind(null, cita.id)}
          className="mt-6 space-y-2 rounded-xl border border-red-900/70 p-4"
        >
          <h2 className="font-semibold text-red-400">Cancelar cita</h2>
          <input
            name="motivo"
            placeholder="Motivo (opcional), ej. el barbero se enfermó"
            className="w-full rounded-lg border border-borde bg-transparent p-3 text-sm"
          />
          <button className="rounded-xl border border-red-500/70 px-4 py-3 text-sm font-semibold text-red-400">
            Cancelar cita
          </button>
        </form>
      )}
    </section>
  );
}
