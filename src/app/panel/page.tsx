// Página /panel: las citas de hoy. Gracias a las reglas de seguridad (RLS),
// la misma consulta le trae al barbero solo sus citas y al dueño todas.
import { obtenerPerfil } from "@/lib/sesion";
import { enlaceWhatsApp, formatoHora, hoyEnBogota, sumarDias } from "@/lib/formato";

type CitaHoy = {
  id: string;
  inicio: string;
  estado: string;
  servicios: { nombre: string } | null;
  clientes: { nombre: string; telefono: string } | null;
  estilistas: { nombre: string } | null;
};

export default async function PanelHoy() {
  const { supabase, perfil } = await obtenerPerfil();
  const hoy = hoyEnBogota();

  // Bogotá está en UTC-5 todo el año (no cambia de hora).
  const { data: citas } = await supabase
    .from("citas")
    .select("id, inicio, estado, servicios(nombre), clientes(nombre, telefono), estilistas(nombre)")
    .gte("inicio", `${hoy}T00:00:00-05:00`)
    .lt("inicio", `${sumarDias(hoy, 1)}T00:00:00-05:00`)
    .neq("estado", "cancelada")
    .order("inicio")
    .returns<CitaHoy[]>();

  return (
    <section>
      <h1 className="text-2xl font-bold">Hola, {perfil?.nombre.split(" ")[0]}</h1>
      <p className="mt-1 text-sm opacity-70">
        {citas?.length ? `Hoy hay ${citas.length} cita(s).` : "Hoy no hay citas."}
      </p>

      <ul className="mt-6 space-y-2">
        {citas?.map((cita) => (
          <li
            key={cita.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-black/10 p-4 dark:border-white/15"
          >
            <div>
              <p className="font-semibold">{formatoHora(cita.inicio)}</p>
              <p className="text-sm">
                {cita.clientes?.nombre} · {cita.servicios?.nombre}
              </p>
              {perfil?.rol === "dueno" && (
                <p className="text-xs opacity-70">con {cita.estilistas?.nombre}</p>
              )}
            </div>
            {cita.clientes && (
              <a href={enlaceWhatsApp(cita.clientes.telefono)} className="text-sm underline">
                WhatsApp
              </a>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs opacity-60">
        En la etapa 5 aquí podrás cancelar, cambiar y marcar las citas como atendidas.
      </p>
    </section>
  );
}
