// Página de inicio. Es un "componente de servidor": se ejecuta en el
// servidor, pide los datos a Supabase y envía el HTML ya listo al celular.
import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { CalendarPlus, ChevronDown, Clock, MapPin, MessageCircle, Scissors } from "lucide-react";
import Adorno from "@/components/Adorno";
import { enlaceWhatsApp, formatoPesos } from "@/lib/formato";
import FondoFoto from "@/components/FondoFoto";

// Le dice a Next.js que vuelva a pedir los datos en cada visita,
// para que un cambio de precio se vea de inmediato.
export const dynamic = "force-dynamic";

type Servicio = {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  duracion_min: number;
};

export default async function Inicio() {
  const supabase = await crearClienteServidor();

  const [{ data: negocio }, { data: servicios, error }] = await Promise.all([
    supabase
      .from("negocio")
      .select("nombre, direccion, telefono_whatsapp, hora_apertura, hora_cierre")
      .single(),
    supabase
      .from("servicios")
      .select("id, nombre, categoria, precio, duracion_min")
      .eq("activo", true)
      .order("categoria")
      .order("precio"),
  ]);

  // Agrupa los servicios por categoría: { Cortes: [...], Barba: [...] }
  const porCategoria = new Map<string, Servicio[]>();
  for (const servicio of (servicios as Servicio[] | null) ?? []) {
    const lista = porCategoria.get(servicio.categoria) ?? [];
    porCategoria.set(servicio.categoria, [...lista, servicio]);
  }

  const estiloAccion =
    "flex items-center justify-center gap-2 rounded-xl border border-zinc-600/60 bg-black/30 py-3 text-sm backdrop-blur";

  return (
    <main className="pb-12">
      <FondoFoto />
      {/* Portada: ocupa casi toda la pantalla, con rayos de luz de fondo */}
      <header className="relative overflow-hidden">
        <div className="rayos absolute inset-0" aria-hidden />
        <div className="relative mx-auto flex min-h-[82svh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full border border-zinc-500/60 bg-black/40 shadow-[0_0_60px_-10px_rgb(255_255_255/0.35)]">
            <Scissors size={34} strokeWidth={1.5} />
          </span>
          <div className="mt-6">
            <Adorno texto="Barbería" />
          </div>
          <h1 className="texto-plata mt-3 text-5xl leading-none font-bold tracking-[0.08em] uppercase sm:text-6xl">
            {negocio?.nombre ?? "Barbería"}
          </h1>
          {negocio && (
            <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-suave">
              <Clock size={14} />
              Abierto de {negocio.hora_apertura.slice(0, 5)} a {negocio.hora_cierre.slice(0, 5)}
            </p>
          )}

          <Link
            href="/reservar"
            className="boton-plata mt-10 flex w-full items-center justify-center gap-2 rounded-xl py-4 font-semibold tracking-wide uppercase"
          >
            <CalendarPlus size={20} />
            Reservar cita
          </Link>

          {/* Contacto: solo aparecen los botones con datos */}
          {negocio && (negocio.telefono_whatsapp || negocio.direccion) && (
            <div className="mt-3 grid w-full grid-cols-2 gap-2">
              {negocio.telefono_whatsapp && (
                <a href={enlaceWhatsApp(negocio.telefono_whatsapp)} className={estiloAccion}>
                  <MessageCircle size={18} />
                  WhatsApp
                </a>
              )}
              {negocio.direccion && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(negocio.direccion)}`}
                  className={estiloAccion}
                >
                  <MapPin size={18} />
                  Cómo llegar
                </a>
              )}
            </div>
          )}

          <ChevronDown size={22} className="mt-10 animate-bounce text-suave" aria-hidden />
        </div>
      </header>

      <div className="mx-auto max-w-md px-4">
        {error && (
          <p className="mb-6 rounded-lg bg-red-950/60 p-4 text-sm text-red-200">
            No se pudo conectar con la base de datos. Revisa tu archivo
            .env.local. Detalle: {error.message}
          </p>
        )}

        {/* Servicios: como la carta de precios colgada en la pared */}
        <section className="rounded-2xl border border-borde bg-tarjeta px-5 py-8">
          <Adorno />
          <h2 className="texto-plata mt-3 text-center text-3xl font-bold tracking-[0.12em] uppercase">
            Servicios
          </h2>
          {[...porCategoria.entries()].map(([categoria, lista]) => (
            <div key={categoria} className="mt-8">
              <p className="text-center text-[11px] font-semibold tracking-[0.35em] text-suave uppercase">
                {categoria}
              </p>
              <ul className="mt-4 space-y-4">
                {lista.map((servicio) => (
                  <li key={servicio.id}>
                    {/* Nombre ........ precio, con puntitos en el medio */}
                    <div className="flex items-baseline gap-2">
                      <p className="font-medium">{servicio.nombre}</p>
                      <span className="flex-1 border-b border-dotted border-zinc-600" />
                      <p className="font-semibold">{formatoPesos(servicio.precio)}</p>
                    </div>
                    <p className="text-xs text-suave">{servicio.duracion_min} min</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {negocio?.direccion && (
          <footer className="mt-10 text-center text-sm text-suave">
            <Adorno />
            <p className="mt-3 flex items-center justify-center gap-1.5">
              <MapPin size={14} />
              {negocio.direccion}
            </p>
          </footer>
        )}
      </div>
    </main>
  );
}
