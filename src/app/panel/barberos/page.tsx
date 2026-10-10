// Página /panel/barberos: solo el dueño. Lista de barberos, crear nuevos,
// cambiar su comisión y desactivar a quien ya no trabaje.
import { exigirDueno } from "@/lib/sesion";
import FormularioBarbero from "./FormularioBarbero";
import { cambiarActivo, cambiarComision } from "./acciones";

type Barbero = {
  id: string;
  nombre: string;
  rol: "dueno" | "barbero";
  porcentaje_comision: number;
  activo: boolean;
};

export default async function PaginaBarberos() {
  const { supabase, perfil } = await exigirDueno();
  const { data: barberos } = await supabase
    .from("estilistas")
    .select("id, nombre, rol, porcentaje_comision, activo")
    .order("activo", { ascending: false })
    .order("nombre")
    .returns<Barbero[]>();

  return (
    <section className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div>
        <h1 className="text-2xl font-bold">Barberos</h1>
        <ul className="mt-4 space-y-2">
          {barberos?.map((b) => (
            <li
              key={b.id}
              className={`rounded-xl border border-black/10 p-4 dark:border-white/15 ${b.activo ? "" : "opacity-50"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{b.nombre}</p>
                  <p className="text-xs opacity-70">
                    {b.rol === "dueno" ? "Dueño" : "Barbero"}
                    {b.activo ? "" : " · desactivado"}
                  </p>
                </div>
                {b.id !== perfil?.id && (
                  <form action={cambiarActivo.bind(null, b.id, !b.activo)}>
                    <button className="text-sm underline">
                      {b.activo ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                )}
              </div>
              <form
                action={cambiarComision.bind(null, b.id)}
                className="mt-3 flex items-center gap-2 text-sm"
              >
                <label htmlFor={`comision-${b.id}`}>Comisión</label>
                <input
                  id={`comision-${b.id}`}
                  name="comision"
                  type="number"
                  min={0}
                  max={100}
                  step="0.5"
                  defaultValue={b.porcentaje_comision}
                  className="w-20 rounded-lg border border-black/20 bg-transparent p-2 dark:border-white/25"
                />
                <span>%</span>
                <button className="rounded-lg border border-black/20 px-3 py-2 dark:border-white/25">
                  Guardar
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>
      <FormularioBarbero />
    </section>
  );
}
