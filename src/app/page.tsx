// Página de inicio. Es un "componente de servidor": se ejecuta en el
// servidor, pide los servicios a Supabase y envía el HTML ya listo al celular.
import { crearClienteServidor } from "@/lib/supabase/server";

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

// Convierte 20000 en "$20.000" (formato de Colombia).
const formatoPesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default async function Inicio() {
  const supabase = await crearClienteServidor();

  const [{ data: negocio }, { data: servicios, error }] = await Promise.all([
    supabase.from("negocio").select("nombre").single(),
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
      <p className="mt-1 text-sm opacity-70">Servicios y precios</p>

      {error && (
        <p className="mt-6 rounded-lg bg-red-100 p-4 text-sm text-red-800">
          No se pudo conectar con la base de datos. Revisa tu archivo
          .env.local. Detalle: {error.message}
        </p>
      )}

      <ul className="mt-6 space-y-3">
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
            <p className="font-semibold">
              {formatoPesos.format(servicio.precio)}
            </p>
          </li>
        ))}
      </ul>

      <button
        disabled
        className="mt-8 w-full rounded-xl bg-black py-4 font-semibold text-white opacity-40 dark:bg-white dark:text-black"
      >
        Reservar cita (etapa 3)
      </button>
    </main>
  );
}
