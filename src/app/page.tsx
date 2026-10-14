// Página de inicio. Es un "componente de servidor": se ejecuta en el
// servidor, pide los datos a Supabase y envía el HTML ya listo al celular.
import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { CalendarPlus, Clock, MapPin, MessageCircle, Scissors } from "lucide-react";
import { enlaceWhatsApp, formatoPesos } from "@/lib/formato";

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
    "flex flex-col items-center gap-1.5 rounded-xl border border-borde bg-tarjeta py-3 text-xs";

  return (
    <main className="mx-auto max-w-md px-4 pb-12">
      {/* Portada */}
      <header className="pt-12 pb-8 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-borde bg-tarjeta">
          <Scissors size={28} />
        </span>
        <h1 className="mt-4 text-4xl font-bold uppercase">{negocio?.nombre ?? "Barbería"}</h1>
        {negocio && (
          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-suave">
            <Clock size={14} />
            Abierto de {negocio.hora_apertura.slice(0, 5)} a {negocio.hora_cierre.slice(0, 5)}
          </p>
        )}
      </header>

      <Link
        href="/reservar"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 font-semibold text-black"
      >
        <CalendarPlus size={20} />
        Reservar cita
      </Link>

      {/* Contacto: solo aparecen los botones con datos */}
      {negocio && (negocio.telefono_whatsapp || negocio.direccion) && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {negocio.telefono_whatsapp && (
            <a href={enlaceWhatsApp(negocio.telefono_whatsapp)} className={estiloAccion}>
              <MessageCircle size={20} />
              WhatsApp
            </a>
          )}
          {negocio.direccion && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(negocio.direccion)}`}
              className={estiloAccion}
            >
              <MapPin size={20} />
              Cómo llegar
            </a>
          )}
        </div>
      )}

      {error && (
        <p className="mt-6 rounded-lg bg-red-950/60 p-4 text-sm text-red-200">
          No se pudo conectar con la base de datos. Revisa tu archivo
          .env.local. Detalle: {error.message}
        </p>
      )}

      <h2 className="mt-10 text-2xl font-bold uppercase">Servicios</h2>
      {[...porCategoria.entries()].map(([categoria, lista]) => (
        <div key={categoria} className="mt-4">
          <p className="text-xs font-semibold tracking-widest text-suave uppercase">{categoria}</p>
          <ul className="mt-2 divide-y divide-borde overflow-hidden rounded-xl border border-borde bg-tarjeta">
            {lista.map((servicio) => (
              <li key={servicio.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{servicio.nombre}</p>
                  <p className="text-sm text-suave">{servicio.duracion_min} min</p>
                </div>
                <p className="font-semibold">{formatoPesos(servicio.precio)}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {negocio?.direccion && (
        <p className="mt-10 flex items-center justify-center gap-1.5 text-center text-sm text-suave">
          <MapPin size={14} />
          {negocio.direccion}
        </p>
      )}
    </main>
  );
}
