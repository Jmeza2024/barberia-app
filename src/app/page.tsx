// Página de inicio. Es un "componente de servidor": se ejecuta en el
// servidor, pide los datos a Supabase y envía el HTML ya listo al celular.
import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatoPesos } from "@/lib/formato";

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

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-3xl font-bold">{negocio?.nombre ?? "Barbería"}</h1>
      {negocio && (
        <div className="mt-2 space-y-1 text-sm opacity-70">
          {negocio.direccion && <p>{negocio.direccion}</p>}
          <p>
            Abierto de {negocio.hora_apertura.slice(0, 5)} a{" "}
            {negocio.hora_cierre.slice(0, 5)}
          </p>
          {negocio.telefono_whatsapp && (
            <a
              className="underline"
              href={`https://wa.me/${negocio.telefono_whatsapp.replace(/\D/g, "")}`}
            >
              Escríbenos por WhatsApp
            </a>
          )}
        </div>
      )}

      <Link
        href="/reservar"
        className="mt-8 block w-full rounded-xl bg-black py-4 text-center font-semibold text-white dark:bg-white dark:text-black"
      >
        Reservar cita
      </Link>

      {error && (
        <p className="mt-6 rounded-lg bg-red-100 p-4 text-sm text-red-800">
          No se pudo conectar con la base de datos. Revisa tu archivo
          .env.local. Detalle: {error.message}
        </p>
      )}

      <h2 className="mt-10 text-xl font-semibold">Servicios y precios</h2>
      <ul className="mt-4 space-y-3">
        {(servicios as Servicio[] | null)?.map((servicio) => (
          <li
            key={servicio.id}
            className="flex items-center justify-between rounded-xl border border-black/10 p-4 dark:border-white/15"
          >
            <div>
              <p className="font-medium">{servicio.nombre}</p>
              <p className="text-sm opacity-70">
                {servicio.categoria} · {servicio.duracion_min} min
              </p>
            </div>
            <p className="font-semibold">{formatoPesos(servicio.precio)}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
